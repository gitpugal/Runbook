package com.runbook.engine.execution;

import com.runbook.engine.controller.dto.ExecutionEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class ExecutionEventPublisher {

    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Client subscribes to execution events
     */
    public SseEmitter subscribe(UUID executionId) {

        SseEmitter emitter = new SseEmitter(0L); // no timeout

        emitters.put(executionId, emitter);

        emitter.onCompletion(() -> {
            log.info("SSE completed for {}", executionId);
            emitters.remove(executionId);
        });

        emitter.onTimeout(() -> {
            log.warn("SSE timeout for {}", executionId);
            emitters.remove(executionId);
        });

        emitter.onError((ex) -> {
            log.error("SSE error for {}", executionId, ex);
            emitters.remove(executionId);
        });

        return emitter;
    }

    /**
     * Publish event to client
     */
    public void publish(UUID executionId, ExecutionEvent event) {

        SseEmitter emitter = emitters.get(executionId);

        if (emitter == null) {
            log.warn("No emitter found for execution {}", executionId);
            return;
        }

        try {
            emitter.send(
                    SseEmitter.event()
                            .name(event.type())
                            .data(event)
            );
        } catch (IOException e) {
            log.error("Failed to send SSE event for {}", executionId, e);
            emitters.remove(executionId);
            emitter.completeWithError(e);
        }
    }

    /**
     * Complete stream
     */
    public void complete(UUID executionId) {
        SseEmitter emitter = emitters.remove(executionId);
        if (emitter != null) {
            emitter.complete();
        }
    }
}
