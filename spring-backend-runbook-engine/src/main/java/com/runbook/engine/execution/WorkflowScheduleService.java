package com.runbook.engine.execution;

import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.domain.Workflow;
import com.runbook.engine.repository.WorkflowRepository;
import com.runbook.engine.service.WorkflowRunnerService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowScheduleService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowRunnerService workflowRunnerService;
    private final TaskScheduler taskScheduler;

    private final Map<UUID, ScheduledFuture<?>> scheduledTasks =
            new ConcurrentHashMap<>();


    /**
     * Load all scheduled workflows when server starts
     */
    @PostConstruct
    public void init() {

        List<Workflow> workflows =
                workflowRepository.findByScheduledTrue();

        workflows.forEach(this::scheduleWorkflow);

        log.info("Loaded {} scheduled workflows", workflows.size());
    }


    /**
     * Register workflow cron
     */
    public void scheduleWorkflow(Workflow workflow) {

        if (workflow.getCronString() == null || workflow.getCronString().isBlank()) {
            return;
        }

        if (workflow.getCronString().split(" ").length == 5) {
            workflow.setCronString("0 " + workflow.getCronString());
        }

        Runnable task = () -> {

            try {

                UUID executionId = UUID.randomUUID();

                log.info(
                        "Triggering scheduled workflow {}",
                        workflow.getId()
                );

                workflowRunnerService.run(
                        workflow.getId(),
                        executionId,
                        false,
                        ExecutionTriggerType.SCHEDULED,
                        java.util.Map.of()
                );

            } catch (Exception e) {
                log.error(
                        "Scheduled workflow execution failed: {}",
                        workflow.getId(),
                        e
                );
            }
        };

        ScheduledFuture<?> future =
                taskScheduler.schedule(
                        task,
                        new CronTrigger(workflow.getCronString())
                );

        scheduledTasks.put(workflow.getId(), future);

        log.info(
                "Scheduled workflow {} with cron {}",
                workflow.getId(),
                workflow.getCronString()
        );
    }


    /**
     * Update workflow schedule when cron changes
     */
    public void rescheduleWorkflow(Workflow workflow) {

        removeSchedule(workflow.getId());
        scheduleWorkflow(workflow);
    }


    /**
     * Remove cron job
     */
    public void removeSchedule(UUID workflowId) {

        ScheduledFuture<?> existing =
                scheduledTasks.remove(workflowId);

        if (existing != null) {
            existing.cancel(false);
        }
    }
}
