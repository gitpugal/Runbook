package com.runbook.engine.execution.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic dataTriggerTopic() {
        return TopicBuilder.name(NodeExecutionTopics.DATA_TRIGGER_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic dataFetchTopic() {
        return TopicBuilder.name(NodeExecutionTopics.DATA_FETCH_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic conditionTopic() {
        return TopicBuilder.name(NodeExecutionTopics.CONDITION_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic dataUpdateTopic() {
        return TopicBuilder.name(NodeExecutionTopics.DATA_UPDATE_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic toolTriggerTopic() {
        return TopicBuilder.name(NodeExecutionTopics.TOOL_TRIGGER_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic joinTopic() {
        return TopicBuilder.name(NodeExecutionTopics.JOIN_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic loopTopic() {
        return TopicBuilder.name(NodeExecutionTopics.LOOP_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic webhookTriggerTopic() {
        return TopicBuilder.name(NodeExecutionTopics.WEBHOOK_TRIGGER_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic emailTopic() {
        return TopicBuilder
                .name("email-events")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
