package com.runbook.engine;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
        classes = RunbookEngineApplication.class,
        properties = {
                "spring.kafka.listener.auto-startup=false",
                "spring.kafka.admin.fail-fast=false",
                "runbook.execution.kafka.create-topics=false"
        }
)
class RunbookEngineApplicationTests {

    @Test
    void contextLoads() {
    }
}
