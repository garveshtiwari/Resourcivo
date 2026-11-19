package com.project.resourcivo.service;

import com.project.resourcivo.model.BookIssue;
import com.project.resourcivo.model.IssueStatus;
import com.project.resourcivo.model.Role;
import com.project.resourcivo.repository.BookIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Daily reminders: books due tomorrow, books overdue (student + librarians), and a clean-up of
 * notifications older than 90 days. Each reminder carries a de-dupe key so it is sent once.
 */
@Component
public class NotificationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(NotificationScheduler.class);
    private static final List<IssueStatus> OUT = List.of(IssueStatus.ISSUED, IssueStatus.RETURN_REQUESTED);

    private final BookIssueRepository issueRepo;
    private final NotificationService notifications;

    public NotificationScheduler(BookIssueRepository issueRepo, NotificationService notifications) {
        this.issueRepo = issueRepo;
        this.notifications = notifications;
    }

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void dailyLibraryReminders() {
        try {
            LocalDate today = LocalDate.now();

            for (BookIssue issue : issueRepo.findByStatusAndExpectedReturnDate(IssueStatus.ISSUED,
                    today.plusDays(1))) {
                notifications.notifyOnce(issue.getStudent().getUserId(), NotificationService.LIBRARY,
                        NotificationService.INFO, "Book due tomorrow",
                        "\"" + issue.getBook().getName() + "\" is due back tomorrow. You can renew it from the Library page.",
                        "/library", "due-soon:" + issue.getId());
            }

            List<BookIssue> overdue = issueRepo.findByStatusInAndExpectedReturnDateBefore(OUT, today);
            for (BookIssue issue : overdue) {
                notifications.notifyOnce(issue.getStudent().getUserId(), NotificationService.LIBRARY,
                        NotificationService.ALERT, "Book overdue",
                        "\"" + issue.getBook().getName() + "\" was due on " + issue.getExpectedReturnDate()
                                + ". Please return it as soon as possible.",
                        "/library", "overdue:" + issue.getId() + ":" + today);
            }

            if (!overdue.isEmpty()) {
                String msg = overdue.size() + (overdue.size() == 1 ? " book is" : " books are") + " overdue.";
                for (Long librarianUserId : notifications.userIdsWithRole(Role.RoleName.ROLE_LIBRARIAN)) {
                    notifications.notifyOnce(librarianUserId, NotificationService.LIBRARY,
                            NotificationService.WARNING, "Overdue books", msg, "/library",
                            "overdue-summary:" + today);
                }
            }

            notifications.purgeOlderThan(LocalDateTime.now().minusDays(90));
        } catch (Exception e) {
            logger.warn("Daily notification job failed: {}", e.getMessage());
        }
    }
}
