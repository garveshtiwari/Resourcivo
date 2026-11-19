package com.project.resourcivo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@resourcivo.com}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Send verification email
     */
    public void sendVerificationEmail(String toEmail, String token) {
        String subject = "Email Verification - Resourcivo";
        String verificationUrl = baseUrl + "/verify-email?token=" + token;

        // Log the URL for testing purposes
        logger.info(">>> VERIFICATION URL for {}: {}", toEmail, verificationUrl);

        String message = "Dear User,\n\n" +
                "Thank you for registering with Resourcivo!\n\n" +
                "Please click the link below to verify your email address:\n" +
                verificationUrl + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you did not create an account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Resourcivo Team";

        sendEmail(toEmail, subject, message);
    }

    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String toEmail, String token) {
        String subject = "Password Reset Request - Resourcivo";
        String resetUrl = baseUrl + "/reset-password?token=" + token;
        logger.info(">>> RESET PASSWORD URL for {}: {}", toEmail, resetUrl);

        String message = "Dear User,\n\n" +
                "We received a request to reset your password.\n\n" +
                "Please click the link below to reset your password:\n" +
                resetUrl + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Resourcivo Team";

        sendEmail(toEmail, subject, message);
    }

    /**
     * Send the temporary credentials for an account an admin created.
     * Returns false if the mail could not be sent (the admin still sees the password once).
     */
    public boolean sendStaffWelcomeEmail(String toEmail, String username, String temporaryPassword) {
        String subject = "Your Resourcivo account";
        String message = "Hello,\n\n" +
                "An administrator has created a Resourcivo account for you.\n\n" +
                "Username: " + username + "\n" +
                "Temporary password: " + temporaryPassword + "\n\n" +
                "Sign in at " + baseUrl + "/login. You will be asked to choose a new password straight away.\n\n" +
                "Best regards,\n" +
                "Resourcivo Team";
        return sendEmail(toEmail, subject, message);
    }

    /**
     * Send generic email
     */
    private boolean sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        try {
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
            return true;
        } catch (MailException e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
            return false;
        }
    }
}
