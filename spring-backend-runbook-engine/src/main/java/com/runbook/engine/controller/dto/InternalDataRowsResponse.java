package com.runbook.engine.controller.dto;

import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record InternalDataRowsResponse(
        List<Map<String, Object>> rows
) {
}
