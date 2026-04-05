package com.runbook.engine.controller.dto;


import lombok.Builder;

import java.util.List;

@Builder
public record EnvironmentDataResponse(
        List<EntityDefinitionResponse> entities,
        List<RelationshipDefinitionResponse> relationships
) {
}
