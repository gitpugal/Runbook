package com.runbook.engine.execution.executors.tools;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.datapacket.DataPacket;
import com.runbook.engine.execution.graph.WorkflowNode;
import com.runbook.engine.execution.kafka.EmailEvent;
import com.runbook.engine.execution.kafka.EmailEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component("email_tool")
@RequiredArgsConstructor
public class EmailTool implements ToolExecutor {

    private final EmailEventProducer producer;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Object execute(WorkflowNode node, ExecutionContext context) {
        log.info("Executing Email Tool");
        List<DataPacket> packets = context.get();
        JsonNode payload = parsePayload(node.getConfigOrEmpty().get("payload"));
        int sent = 0;

        for (DataPacket packet : packets) {
            if (packet.get("email") != null) {
                producer.sendEmailEvent(
                        EmailEvent.builder()
                                .body(payload.path("body").asText(""))
                                .to(packet.get("email").toString())
                                .subject(payload.path("subject").asText(""))
                                .build()
                );
                sent++;
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("sent", sent);
        summary.put("recipients", packets.stream().map(packet -> packet.get("email")).toList());
        return summary;
    }

    @Override
    public String getType() {
        return "email_tool";
    }

    private JsonNode parsePayload(Object payloadConfig) {
        try {
            if (payloadConfig instanceof String payloadString) {
                return objectMapper.readTree(payloadString);
            }
            return objectMapper.valueToTree(payloadConfig == null ? Map.of() : payloadConfig);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid email tool payload", exception);
        }
    }
}
