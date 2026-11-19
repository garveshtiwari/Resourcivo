package com.project.resourcivo.controller;

import com.project.resourcivo.model.BookingStatus;
import com.project.resourcivo.model.IssueStatus;
import com.project.resourcivo.model.Role;
import com.project.resourcivo.model.Transport;
import com.project.resourcivo.model.User;
import com.project.resourcivo.repository.BookIssueRepository;
import com.project.resourcivo.repository.ClassroomRepository;
import com.project.resourcivo.repository.CourseRepository;
import com.project.resourcivo.repository.FacultyRepository;
import com.project.resourcivo.repository.InventoryItemRepository;
import com.project.resourcivo.repository.LabEquipmentRepository;
import com.project.resourcivo.repository.LibraryBookRepository;
import com.project.resourcivo.repository.StudentRepository;
import com.project.resourcivo.repository.TransportBookingRepository;
import com.project.resourcivo.repository.TransportRepository;
import com.project.resourcivo.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * One call that returns the numbers the dashboard needs for the signed-in role.
 */
@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Role-aware summary numbers")
public class DashboardController {

    private static final List<IssueStatus> OUT = List.of(IssueStatus.ISSUED, IssueStatus.RETURN_REQUESTED);

    private final CurrentUser currentUser;
    private final StudentRepository studentRepo;
    private final FacultyRepository facultyRepo;
    private final CourseRepository courseRepo;
    private final ClassroomRepository classroomRepo;
    private final LibraryBookRepository bookRepo;
    private final BookIssueRepository issueRepo;
    private final InventoryItemRepository inventoryRepo;
    private final LabEquipmentRepository labRepo;
    private final TransportRepository transportRepo;
    private final TransportBookingRepository bookingRepo;
    private final com.project.resourcivo.service.BookIssueService issueService;

    public DashboardController(CurrentUser currentUser, StudentRepository studentRepo, FacultyRepository facultyRepo,
            CourseRepository courseRepo, ClassroomRepository classroomRepo, LibraryBookRepository bookRepo,
            BookIssueRepository issueRepo, InventoryItemRepository inventoryRepo, LabEquipmentRepository labRepo,
            TransportRepository transportRepo, TransportBookingRepository bookingRepo,
            com.project.resourcivo.service.BookIssueService issueService) {
        this.currentUser = currentUser;
        this.studentRepo = studentRepo;
        this.facultyRepo = facultyRepo;
        this.courseRepo = courseRepo;
        this.classroomRepo = classroomRepo;
        this.bookRepo = bookRepo;
        this.issueRepo = issueRepo;
        this.inventoryRepo = inventoryRepo;
        this.labRepo = labRepo;
        this.transportRepo = transportRepo;
        this.bookingRepo = bookingRepo;
        this.issueService = issueService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Dashboard summary", description = "Counts for the signed-in user's role")
    public ResponseEntity<Map<String, Object>> summary() {
        User user = currentUser.require();
        Map<String, Object> out = new LinkedHashMap<>();

        if (currentUser.isAdmin()) {
            out.put("students", studentRepo.count());
            out.put("faculty", facultyRepo.count());
            out.put("courses", courseRepo.count());
            out.put("classrooms", classroomRepo.count());
            out.put("books", bookRepo.count());
            out.put("booksIssued", bookRepo.countByIsIssued(true));
            out.put("lowStockItems", inventoryRepo.countLowStock());
            out.put("labMaintenanceDue", labRepo
                    .findByNextMaintenanceDueDateLessThanEqualOrderByNextMaintenanceDueDateAsc(LocalDate.now().plusDays(30))
                    .size());
            out.put("pendingIssueRequests", issueRepo.countByStatus(IssueStatus.PENDING));
            out.put("pendingReturns", issueRepo.countByStatus(IssueStatus.RETURN_REQUESTED));
            out.put("overdueBooks", issueRepo.countByStatusInAndExpectedReturnDateBefore(OUT, LocalDate.now()));
            addTransportNumbers(out);
        } else if (currentUser.hasRole("ROLE_LIBRARIAN")) {
            out.put("books", bookRepo.count());
            out.put("booksIssued", bookRepo.countByIsIssued(true));
            out.put("pendingIssueRequests", issueService.countPendingForDesk());
            out.put("pendingReturns", issueService.countReturnRequestsForDesk());
            out.put("overdueBooks", issueService.countOverdueForDesk());
        } else if (currentUser.hasRole("ROLE_TRANSPORT_MANAGER")) {
            addTransportNumbers(out);
        } else {
            Role.RoleName type = currentUser.hasRole("ROLE_FACULTY") ? Role.RoleName.ROLE_FACULTY
                    : Role.RoleName.ROLE_STUDENT;
            out.put("hasTransportBooking",
                    bookingRepo.existsByUserIdAndUserTypeAndStatus(user.getId(), type, BookingStatus.ACTIVE));
            if (type == Role.RoleName.ROLE_STUDENT) {
                studentRepo.findByUserId(user.getId()).ifPresent(student -> {
                    out.put("booksBorrowed", issueRepo.countByStudentIdAndStatusIn(student.getId(), OUT));
                    out.put("requestsPending", issueRepo.countByStudentIdAndStatus(student.getId(), IssueStatus.PENDING));
                    out.put("booksOverdue", issueRepo.countByStudentIdAndStatusInAndExpectedReturnDateBefore(
                            student.getId(), OUT, LocalDate.now()));
                });
            }
        }
        return ResponseEntity.ok(out);
    }

    private void addTransportNumbers(Map<String, Object> out) {
        List<Transport> vehicles = transportRepo.findAll();
        out.put("vehicles", vehicles.size());
        out.put("seatsAvailable", vehicles.stream().filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .mapToInt(Transport::getAvailableSeats).sum());
        out.put("activeTransportBookings", bookingRepo.countByStatus(BookingStatus.ACTIVE));
    }
}
