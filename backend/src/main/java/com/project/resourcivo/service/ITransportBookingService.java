package com.project.resourcivo.service;

import com.project.resourcivo.dto.TransportBookingRequestDTO;
import com.project.resourcivo.dto.TransportBookingResponseDTO;
import com.project.resourcivo.model.Role;

import java.util.List;

public interface ITransportBookingService {
    TransportBookingResponseDTO bookTransport(Long userId, Role.RoleName userType, TransportBookingRequestDTO dto);

    void cancelBooking(Long userId, Role.RoleName userType);

    TransportBookingResponseDTO getMyBooking(Long userId, Role.RoleName userType);

    List<TransportBookingResponseDTO> getBookingsForTransport(Long transportId);

    List<TransportBookingResponseDTO> getAllBookings();

    void cancelBookingById(Long bookingId);

    /**
     * Cancels every active booking on a vehicle that is no longer running, frees the seats and
     * notifies the affected users and the transport managers. Returns how many were cancelled.
     */
    int cancelBookingsForInactiveTransport(com.project.resourcivo.model.Transport transport);

    /** Clears active bookings that were left on vehicles already inactive. Returns how many. */
    int sweepBookingsOnInactiveTransports();
}
