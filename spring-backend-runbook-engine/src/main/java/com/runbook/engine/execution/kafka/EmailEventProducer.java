package com.runbook.engine.execution.kafka;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class EmailEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public EmailEventProducer(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper) {

        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void sendEmailEvent(EmailEvent event) {

        try {

            String json = objectMapper.writeValueAsString(event);

            kafkaTemplate.send("email-events", event.getTo(), json);

        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize EmailEvent", e);
        }
    }
}