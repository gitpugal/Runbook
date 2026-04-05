package com.runbook.engine.execution.kafka;

import lombok.*;

@Getter
@Setter
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailEvent {

    private String to;
    private String subject;
    private String body;
}