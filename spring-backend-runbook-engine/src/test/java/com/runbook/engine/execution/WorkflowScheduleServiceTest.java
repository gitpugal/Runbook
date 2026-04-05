package com.runbook.engine.execution;

import com.runbook.engine.domain.Workflow;
import com.runbook.engine.repository.WorkflowRepository;
import com.runbook.engine.service.WorkflowRunnerService;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.Trigger;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ScheduledFuture;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WorkflowScheduleServiceTest {

    @Test
    void rescheduleWorkflowCancelsExistingSchedule() {
        WorkflowRepository repository = mock(WorkflowRepository.class);
        WorkflowRunnerService runnerService = mock(WorkflowRunnerService.class);
        TaskScheduler taskScheduler = mock(TaskScheduler.class);
        ScheduledFuture<Object> scheduledFuture = mock(ScheduledFuture.class);
        when(repository.findByScheduledTrue()).thenReturn(List.of());
        doReturn(scheduledFuture).when(taskScheduler).schedule(any(Runnable.class), any(Trigger.class));

        WorkflowScheduleService service = new WorkflowScheduleService(repository, runnerService, taskScheduler);
        Workflow workflow = Workflow.builder()
                .id(UUID.randomUUID())
                .cronString("0 */5 * * * *")
                .build();

        service.scheduleWorkflow(workflow);
        service.rescheduleWorkflow(workflow);

        verify(scheduledFuture).cancel(false);
        verify(taskScheduler, times(2)).schedule(any(Runnable.class), any(Trigger.class));
    }
}
