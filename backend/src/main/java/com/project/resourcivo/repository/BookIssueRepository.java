package com.project.resourcivo.repository;

import com.project.resourcivo.model.BookIssue;
import com.project.resourcivo.model.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookIssueRepository extends JpaRepository<BookIssue, Long> {
    List<BookIssue> findByStudentIdAndStatus(Long studentId, IssueStatus status);

    List<BookIssue> findByStudentId(Long studentId);

    List<BookIssue> findByStatus(IssueStatus status);

    List<BookIssue> findByStudentIdAndStatusIn(Long studentId, List<IssueStatus> statuses);

    List<BookIssue> findByBookId(Long bookId);

    long countByStatus(IssueStatus status);

    long countByStatusInAndExpectedReturnDateBefore(List<IssueStatus> statuses, java.time.LocalDate date);

    long countByStudentIdAndStatus(Long studentId, IssueStatus status);

    long countByStudentIdAndStatusIn(Long studentId, List<IssueStatus> statuses);

    long countByStudentIdAndStatusInAndExpectedReturnDateBefore(Long studentId, List<IssueStatus> statuses,
            java.time.LocalDate date);

    boolean existsByStudentIdAndBookIdAndStatusIn(Long studentId, Long bookId, List<IssueStatus> statuses);

    List<BookIssue> findByStatusInAndExpectedReturnDateBefore(List<IssueStatus> statuses, java.time.LocalDate date);

    List<BookIssue> findByStatusAndExpectedReturnDate(IssueStatus status, java.time.LocalDate date);

    org.springframework.data.domain.Page<BookIssue> findByStatus(IssueStatus status,
            org.springframework.data.domain.Pageable pageable);

    // Issues a librarian may handle: books of the given libraries, plus books that belong to no library
    @org.springframework.data.jpa.repository.Query("select i from BookIssue i where i.status = :status "
            + "and (i.book.library is null or i.book.library.id in :libraryIds)")
    org.springframework.data.domain.Page<BookIssue> findVisibleByStatus(
            @org.springframework.data.repository.query.Param("status") IssueStatus status,
            @org.springframework.data.repository.query.Param("libraryIds") java.util.Collection<Long> libraryIds,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("select i from BookIssue i "
            + "where i.book.library is null or i.book.library.id in :libraryIds")
    org.springframework.data.domain.Page<BookIssue> findVisible(
            @org.springframework.data.repository.query.Param("libraryIds") java.util.Collection<Long> libraryIds,
            org.springframework.data.domain.Pageable pageable);
}
