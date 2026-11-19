package com.project.resourcivo.service;

import com.project.resourcivo.dto.BookIssueRequestDTO;
import com.project.resourcivo.dto.BookIssueResponseDTO;
import com.project.resourcivo.model.*;
import com.project.resourcivo.repository.BookIssueRepository;
import com.project.resourcivo.repository.LibraryBookRepository;
import com.project.resourcivo.repository.LibraryRepository;
import com.project.resourcivo.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class BookIssueService {

    private final BookIssueRepository issueRepo;
    private final LibraryBookRepository bookRepo;
    private final StudentRepository studentRepo;
    private final LibraryRepository libraryRepo;
    private final com.project.resourcivo.security.CurrentUser currentUser;
    private final NotificationService notifications;

    private static final List<IssueStatus> OPEN = List.of(IssueStatus.PENDING, IssueStatus.ISSUED,
            IssueStatus.RETURN_REQUESTED);
    private static final List<IssueStatus> OUT = List.of(IssueStatus.ISSUED, IssueStatus.RETURN_REQUESTED);

    public BookIssueService(BookIssueRepository issueRepo, LibraryBookRepository bookRepo,
            StudentRepository studentRepo, LibraryRepository libraryRepo,
            com.project.resourcivo.security.CurrentUser currentUser, NotificationService notifications) {
        this.issueRepo = issueRepo;
        this.bookRepo = bookRepo;
        this.studentRepo = studentRepo;
        this.libraryRepo = libraryRepo;
        this.currentUser = currentUser;
        this.notifications = notifications;
    }

    private static String studentName(Student s) {
        return (s.getFirstName() + " " + s.getLastName()).trim();
    }

    /** The librarian of the book's library; if that library has none, every librarian. */
    private void notifyLibrarians(LibraryBook book, String level, String title, String message) {
        List<Long> ids = new java.util.ArrayList<>();
        Library library = book.getLibrary();
        if (library != null && library.getLibrarian() != null && library.getLibrarian().getUserId() != null) {
            ids.add(library.getLibrarian().getUserId());
        } else {
            ids.addAll(notifications.userIdsWithRole(Role.RoleName.ROLE_LIBRARIAN));
        }
        notifications.notifyAll(ids, NotificationService.LIBRARY, level, title, message, "/library");
    }

    private void notifyStudent(Student student, String level, String title, String message) {
        notifications.notify(student.getUserId(), NotificationService.LIBRARY, level, title, message, "/library");
    }

    /**
     * Libraries the signed-in librarian may handle, or null for an admin (no limit). A librarian handles their own
     * library, plus every library that has no librarian of its own, so no request is left without someone to act on it.
     */
    private Set<Long> handledLibraryIds() {
        if (currentUser.isAdmin()) {
            return null;
        }
        Long me = currentUser.require().getId();
        Set<Long> ids = new HashSet<>();
        for (Library library : libraryRepo.findAll()) {
            Librarian owner = library.getLibrarian();
            if (owner == null || owner.getUserId() == null || owner.getUserId().equals(me)) {
                ids.add(library.getId());
            }
        }
        return ids;
    }

    /** Filter for lists shown on the library desk. */
    private Predicate<BookIssue> deskFilter() {
        Set<Long> ids = handledLibraryIds();
        if (ids == null) {
            return i -> true;
        }
        return i -> {
            Library library = i.getBook().getLibrary();
            return library == null || ids.contains(library.getId());
        };
    }

    /** A librarian may only act on requests for their own library (or for libraries nobody manages). */
    private void assertDeskAccess(BookIssue issue) {
        Set<Long> ids = handledLibraryIds();
        Library library = issue.getBook().getLibrary();
        if (ids != null && library != null && !ids.contains(library.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "This request belongs to another library. Only its librarian can handle it.");
        }
    }

    /** Only the student's own login (or an admin) may act on a student's issues. */
    private void assertStudentAccess(Student student) {
        currentUser.requireSelfOrAdmin(student.getUserId());
    }

    private void assertStudentAccess(Long studentId) {
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        assertStudentAccess(student);
    }

    @Transactional
    public BookIssueResponseDTO requestIssue(BookIssueRequestDTO dto) {
        Student student = studentRepo.findById(dto.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        assertStudentAccess(student);
        LibraryBook book = bookRepo.findById(dto.getBookId())
                .orElseThrow(() -> new IllegalArgumentException("Book not found"));

        if (Boolean.TRUE.equals(book.getIsIssued())) {
            throw new IllegalStateException("Book is already issued");
        }
        if (issueRepo.existsByStudentIdAndBookIdAndStatusIn(student.getId(), book.getId(), OPEN)) {
            throw new IllegalStateException("You already have an open request for this book");
        }

        BookIssue issue = new BookIssue();
        issue.setStudent(student);
        issue.setBook(book);
        issue.setStatus(IssueStatus.PENDING);
        issue.setRequestDate(LocalDate.now());

        BookIssue saved = issueRepo.save(issue);
        notifyLibrarians(book, NotificationService.INFO, "New book request",
                studentName(student) + " requested \"" + book.getName() + "\".");
        return toResponse(saved);
    }

    @Transactional
    public BookIssueResponseDTO approveIssue(Long issueId) {
        BookIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue request not found"));
        assertDeskAccess(issue);

        if (issue.getStatus() != IssueStatus.PENDING) {
            throw new IllegalStateException("Request is not in PENDING state");
        }

        LibraryBook book = issue.getBook();
        if (Boolean.TRUE.equals(book.getIsIssued())) {
            throw new IllegalStateException("Book is already issued to someone else");
        }

        issue.setStatus(IssueStatus.ISSUED);
        issue.setIssueDate(LocalDate.now());
        issue.setExpectedReturnDate(LocalDate.now().plusWeeks(2)); // Default 2 weeks

        book.setIsIssued(true);
        bookRepo.save(book);

        BookIssue saved = issueRepo.save(issue);
        notifyStudent(issue.getStudent(), NotificationService.SUCCESS, "Book request approved",
                "\"" + book.getName() + "\" has been issued to you. Please return it by "
                        + issue.getExpectedReturnDate() + ".");
        return toResponse(saved);
    }

    @Transactional
    public BookIssueResponseDTO rejectIssue(Long issueId) {
        BookIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue request not found"));
        assertDeskAccess(issue);

        if (issue.getStatus() != IssueStatus.PENDING) {
            throw new IllegalStateException("Request is not in PENDING state");
        }

        issue.setStatus(IssueStatus.REJECTED);
        BookIssue saved = issueRepo.save(issue);
        notifyStudent(issue.getStudent(), NotificationService.WARNING, "Book request declined",
                "Your request for \"" + issue.getBook().getName() + "\" was declined.");
        return toResponse(saved);
    }

    @Transactional
    public BookIssueResponseDTO requestReturn(Long issueId) {
        BookIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue request not found"));

        assertStudentAccess(issue.getStudent());
        if (issue.getStatus() != IssueStatus.ISSUED) {
            throw new IllegalStateException("Book is not currently issued");
        }

        issue.setStatus(IssueStatus.RETURN_REQUESTED);
        BookIssue saved = issueRepo.save(issue);
        notifyLibrarians(issue.getBook(), NotificationService.INFO, "Return requested",
                studentName(issue.getStudent()) + " wants to return \"" + issue.getBook().getName() + "\".");
        return toResponse(saved);
    }

    @Transactional
    public BookIssueResponseDTO confirmReturn(Long issueId) {
        BookIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue request not found"));
        assertDeskAccess(issue);

        if (issue.getStatus() != IssueStatus.RETURN_REQUESTED) {
            throw new IllegalStateException("Return request not found");
        }

        LibraryBook book = issue.getBook();
        book.setIsIssued(false);
        bookRepo.save(book);

        issue.setStatus(IssueStatus.RETURNED);
        issue.setReturnDate(LocalDate.now());

        BookIssue saved = issueRepo.save(issue);
        notifyStudent(issue.getStudent(), NotificationService.SUCCESS, "Return confirmed",
                "Your return of \"" + book.getName() + "\" has been confirmed. Thank you!");
        return toResponse(saved);
    }

    @Transactional
    public BookIssueResponseDTO rejectReturn(Long issueId) {
        BookIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue request not found"));
        assertDeskAccess(issue);

        if (issue.getStatus() != IssueStatus.RETURN_REQUESTED) {
            throw new IllegalStateException("Return request not found");
        }

        // Revert to ISSUED as request was declined
        issue.setStatus(IssueStatus.ISSUED);
        BookIssue saved = issueRepo.save(issue);
        notifyStudent(issue.getStudent(), NotificationService.WARNING, "Return not accepted",
                "Your return of \"" + issue.getBook().getName() + "\" was not accepted. "
                        + "Please check with the librarian.");
        return toResponse(saved);
    }

    /** A student withdraws a request that has not been approved yet. */
    @Transactional
    public void cancelRequest(Long issueId) {
        BookIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue request not found"));
        assertStudentAccess(issue.getStudent());
        if (issue.getStatus() != IssueStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be cancelled");
        }
        notifyLibrarians(issue.getBook(), NotificationService.INFO, "Book request withdrawn",
                studentName(issue.getStudent()) + " cancelled the request for \"" + issue.getBook().getName() + "\".");
        issueRepo.delete(issue);
    }

    /** Extend a loan by one week, up to six weeks in total. Overdue loans cannot be renewed. */
    @Transactional
    public BookIssueResponseDTO renew(Long issueId) {
        BookIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue request not found"));
        assertStudentAccess(issue.getStudent());
        if (issue.getStatus() != IssueStatus.ISSUED) {
            throw new IllegalStateException("Only books that are currently issued can be renewed");
        }
        LocalDate due = issue.getExpectedReturnDate();
        if (due == null || due.isBefore(LocalDate.now())) {
            throw new IllegalStateException("Overdue books cannot be renewed. Please return the book.");
        }
        if (issue.getIssueDate() != null && !due.plusWeeks(1).isBefore(issue.getIssueDate().plusWeeks(6).plusDays(1))) {
            throw new IllegalStateException("Maximum loan period reached");
        }
        issue.setExpectedReturnDate(due.plusWeeks(1));
        return toResponse(issueRepo.save(issue));
    }

    public List<BookIssueResponseDTO> getReturnRequests() {
        return issueRepo.findByStatus(IssueStatus.RETURN_REQUESTED).stream().filter(deskFilter())
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<BookIssueResponseDTO> getOverdue() {
        return issueRepo.findByStatusInAndExpectedReturnDateBefore(OUT, LocalDate.now()).stream()
                .filter(deskFilter()).map(this::toResponse).collect(Collectors.toList());
    }

    /** All issues, optionally filtered by status, newest first, one page at a time. */
    public org.springframework.data.domain.Page<BookIssueResponseDTO> getIssues(IssueStatus status, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
        Set<Long> ids = handledLibraryIds();
        org.springframework.data.domain.Page<BookIssue> result;
        if (ids == null) {
            result = status == null ? issueRepo.findAll(pageable) : issueRepo.findByStatus(status, pageable);
        } else {
            ids.add(-1L); // keeps the IN list non-empty
            result = status == null
                    ? issueRepo.findVisible(ids, pageable)
                    : issueRepo.findVisibleByStatus(status, ids, pageable);
        }
        return result.map(this::toResponse);
    }

    public List<BookIssueResponseDTO> getEffectiveIssuedBooks(Long studentId) {
        assertStudentAccess(studentId);
        // Returns books that are currently out (ISSUED or RETURN_REQUESTED)
        return issueRepo
                .findByStudentIdAndStatusIn(studentId, List.of(IssueStatus.ISSUED, IssueStatus.RETURN_REQUESTED))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookIssueResponseDTO> getIssueHistory(Long studentId) {
        assertStudentAccess(studentId);
        return issueRepo.findByStudentId(studentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookIssueResponseDTO> getBookHistory(Long bookId) {
        return issueRepo.findByBookId(bookId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookIssueResponseDTO> getAllPendingRequests() {
        return issueRepo.findByStatus(IssueStatus.PENDING).stream()
                .filter(deskFilter())
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Desk numbers for the dashboard: only what the signed-in librarian can act on
    public long countPendingForDesk() {
        return issueRepo.findByStatus(IssueStatus.PENDING).stream().filter(deskFilter()).count();
    }

    public long countReturnRequestsForDesk() {
        return issueRepo.findByStatus(IssueStatus.RETURN_REQUESTED).stream().filter(deskFilter()).count();
    }

    public long countOverdueForDesk() {
        return issueRepo.findByStatusInAndExpectedReturnDateBefore(OUT, LocalDate.now()).stream()
                .filter(deskFilter()).count();
    }

    private BookIssueResponseDTO toResponse(BookIssue e) {
        BookIssueResponseDTO r = new BookIssueResponseDTO();
        r.setId(e.getId());
        r.setStudentId(e.getStudent().getId());
        r.setStudentName(e.getStudent().getFirstName() + " " + e.getStudent().getLastName());
        r.setBookId(e.getBook().getId());
        r.setBookName(e.getBook().getName());
        if (e.getBook().getLibrary() != null) {
            r.setLibraryId(e.getBook().getLibrary().getId());
            r.setLibraryName(e.getBook().getLibrary().getName());
        }
        r.setStatus(e.getStatus());
        r.setRequestDate(e.getRequestDate());
        r.setIssueDate(e.getIssueDate());
        r.setExpectedReturnDate(e.getExpectedReturnDate());
        r.setReturnDate(e.getReturnDate());
        r.setOverdue(OUT.contains(e.getStatus()) && e.getExpectedReturnDate() != null
                && e.getExpectedReturnDate().isBefore(LocalDate.now()));
        return r;
    }
}
