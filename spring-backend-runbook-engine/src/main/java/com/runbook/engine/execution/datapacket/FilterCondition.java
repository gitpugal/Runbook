package com.runbook.engine.execution.datapacket;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FilterCondition {

    private final String column;
    private final String operator;
    private final Object value;
}