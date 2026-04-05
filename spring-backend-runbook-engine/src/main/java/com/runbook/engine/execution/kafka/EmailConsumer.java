package com.runbook.engine.execution.kafka;

import com.runbook.engine.service.EmailService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class EmailConsumer {

    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    public EmailConsumer(ObjectMapper objectMapper,
                         EmailService emailService) {

        this.objectMapper = objectMapper;
        this.emailService = emailService;
    }

    @KafkaListener(topics = "email-events", groupId = "email-service")
    public void consume(String message) {

        try {

            EmailEvent event =
                    objectMapper.readValue(message, EmailEvent.class);

            emailService.sendSimpleEmail(
                    event.getTo(),
                    event.getSubject(),
                    event.getBody()
            );

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse email event", e);
        }
    }
}