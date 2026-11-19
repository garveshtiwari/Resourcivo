package com.project.resourcivo.service;

import com.project.resourcivo.dto.TransportBookingRequestDTO;
import com.project.resourcivo.dto.TransportBookingResponseDTO;
import com.project.resourcivo.mapper.TransportBookingMapper;
import com.project.resourcivo.model.BookingStatus;
import com.project.resourcivo.model.Role;
import com.project.resourcivo.model.Transport;
import com.project.resourcivo.model.TransportBooking;
import com.project.resourcivo.repository.TransportBookingRepository;
import com.project.resourcivo.repository.TransportRepository;
import com.project.resourcivo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransportBookingService implements ITransportBookingService {

    private final TransportBookingRepository bookingRepository;
    private final TransportRepository transportRepository;
    private final NotificationService notifications;
    private final UserRepository userRepository;

    public TransportBookingService(TransportBookingRepository bookingRepository,
            TransportRepository transportRepository, NotificationService notifications,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.transportRepository = transportRepository;
        this.notifications = notifications;
        this.userRepository = userRepository;
    }

    private static String vehicleLabel(Transport t) {
        String name = t.getVehicleName() != null && !t.getVehicleName().isBlank() ? t.getVehicleName()
                : "Vehicle";
        return t.getRegistrationNumber() != null ? name + " (" + t.getRegistrationNumber() + ")" : name;
    }

    private String personName(Long userId) {
        return userRepository.findById(userId).map(u -> {
            String full = ((u.getFirstName() == null ? "" : u.getFirstName()) + " "
                    + (u.getLastName() == null ? "" : u.getLastName())).trim();
            return full.isEmpty() ? u.getUsername() : full;
        }).orElse("A user");
    }

    private void notifyManagers(String level, String title, String message) {
        notifications.notifyRole(Role.RoleName.ROLE_TRANSPORT_MANAGER, NotificationService.TRANSPORT, level, title,
                message, "/transport");
    }

    @Override
    @Transactional
    public TransportBookingResponseDTO bookTransport(Long userId, Role.RoleName userType,
            TransportBookingRequestDTO dto) {
        // 1. Check if user already has an active booking
        if (bookingRepository.existsByUserIdAndUserTypeAndStatus(userId, userType, BookingStatus.ACTIVE)) {
            throw new IllegalStateException("User already has an active transport booking");
        }

        // 2. Fetch transport and check availability
        Transport transport = transportRepository.findById(dto.getTransportId())
                .orElseThrow(() -> new IllegalArgumentException("Transport not found"));

        if (!transport.getIsActive()) {
            throw new IllegalArgumentException("Transport is not currently active");
        }

        if (transport.getAvailableSeats() <= 0) {
            throw new IllegalStateException("No seats available on this transport");
        }

        // 3. Create booking
        TransportBooking booking = TransportBookingMapper.toEntity(dto, transport, userId, userType);
        booking.setStatus(BookingStatus.ACTIVE);

        // 4. Update transport avaialble seats
        transport.setAvailableSeats(transport.getAvailableSeats() - 1);
        transportRepository.save(transport);

        // 5. Save booking
        TransportBooking savedBooking = bookingRepository.save(booking);

        notifications.notify(userId, NotificationService.TRANSPORT, NotificationService.SUCCESS,
                "Transport booked", "Your seat on " + vehicleLabel(transport) + " is confirmed.", "/transport");
        notifyManagers(NotificationService.INFO, "New transport booking",
                personName(userId) + " booked a seat on " + vehicleLabel(transport) + ".");
        if (transport.getAvailableSeats() <= 0) {
            notifyManagers(NotificationService.WARNING, "Vehicle is full",
                    vehicleLabel(transport) + " has no seats left.");
        }

        return TransportBookingMapper.toResponse(savedBooking);
    }

    @Override
    @Transactional
    public void cancelBooking(Long userId, Role.RoleName userType) {
        TransportBooking booking = bookingRepository
                .findByUserIdAndUserTypeAndStatus(userId, userType, BookingStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("No active transport booking found for this user"));

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // Restore seat availability
        Transport transport = booking.getTransport();
        transport.setAvailableSeats(transport.getAvailableSeats() + 1);
        transportRepository.save(transport);

        notifications.notify(userId, NotificationService.TRANSPORT, NotificationService.INFO,
                "Booking cancelled", "Your booking on " + vehicleLabel(transport) + " has been cancelled.",
                "/transport");
        notifyManagers(NotificationService.INFO, "Booking cancelled",
                personName(userId) + " cancelled their seat on " + vehicleLabel(transport) + ".");
    }

    @Override
    @Transactional
    public TransportBookingResponseDTO getMyBooking(Long userId, Role.RoleName userType) {
        TransportBooking booking = bookingRepository
                .findByUserIdAndUserTypeAndStatus(userId, userType, BookingStatus.ACTIVE).orElse(null);
        if (booking == null) {
            return null;
        }
        // A booking left on a vehicle that has since been deactivated is stale: cancel it now.
        if (!Boolean.TRUE.equals(booking.getTransport().getIsActive())) {
            cancelForInactive(booking);
            return null;
        }
        return TransportBookingMapper.toResponse(booking);
    }

    @Override
    public List<TransportBookingResponseDTO> getBookingsForTransport(Long transportId) {
        return bookingRepository.findByTransportIdAndStatus(transportId, BookingStatus.ACTIVE)
                .stream()
                .map(TransportBookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransportBookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(TransportBookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelBookingById(Long bookingId) {
        TransportBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new IllegalStateException("Only active bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        Transport transport = booking.getTransport();
        transport.setAvailableSeats(transport.getAvailableSeats() + 1);
        transportRepository.save(transport);

        notifications.notify(booking.getUserId(), NotificationService.TRANSPORT, NotificationService.WARNING,
                "Your booking was cancelled",
                "Your booking on " + vehicleLabel(transport) + " was cancelled by the transport office.",
                "/transport");
    }

    @Override
    @Transactional
    public int cancelBookingsForInactiveTransport(Transport transport) {
        List<TransportBooking> active = bookingRepository.findByTransportIdAndStatus(transport.getId(),
                BookingStatus.ACTIVE);
        for (TransportBooking booking : active) {
            cancelForInactive(booking);
        }
        if (!active.isEmpty()) {
            notifyManagers(NotificationService.WARNING, "Vehicle deactivated",
                    vehicleLabel(transport) + " was deactivated and " + active.size()
                            + (active.size() == 1 ? " booking was" : " bookings were") + " cancelled.");
        }
        return active.size();
    }

    @Override
    @Transactional
    public int sweepBookingsOnInactiveTransports() {
        int cancelled = 0;
        for (Transport t : transportRepository.findByIsActive(false)) {
            cancelled += cancelBookingsForInactiveTransport(t);
        }
        return cancelled;
    }

    /** Cancels one booking because its vehicle stopped running, frees the seat and tells the user. */
    private void cancelForInactive(TransportBooking booking) {
        Transport transport = booking.getTransport();
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        transport.setAvailableSeats(Math.min(transport.getAvailableSeats() + 1, transport.getTotalSeats()));
        transportRepository.save(transport);

        notifications.notify(booking.getUserId(), NotificationService.TRANSPORT, NotificationService.ALERT,
                "Booking cancelled - vehicle not running",
                vehicleLabel(transport) + " is no longer running, so your booking has been cancelled. "
                        + "You can book another vehicle.",
                "/transport");
    }
}
