package com.runbook.engine.execution;

import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.domain.ExecutionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_executions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowExecution {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID workflowId;

    private UUID versionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExecutionStatus status;

    @Enumerated(EnumType.STRING)
    private ExecutionTriggerType triggerType;

    @Column(columnDefinition = "TEXT")
    private String contextJson;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private Instant startedAt;
    private Instant finishedAt;
    private Instant createdAt;
}
