package com.runbook.engine.controller.dto;

import lombok.Getter;
import lombok.Setter;

public record ExecutionEvent(
        String type,
        String nodeId,
        String message
) {}
