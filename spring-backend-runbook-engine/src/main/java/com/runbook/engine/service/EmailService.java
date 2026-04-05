package com.runbook.engine.service;

public interface EmailService {

    void sendSimpleEmail(String to, String subject, String body);

    void sendHtmlEmail(String to, String subject, String htmlBody);

    void sendEmailWithAttachment(String to, String subject, String body, String pathToAttachment);
}