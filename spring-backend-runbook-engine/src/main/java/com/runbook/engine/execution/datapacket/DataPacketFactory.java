package com.runbook.engine.execution.datapacket;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class DataPacketFactory {

    private final JdbcDataPacketRepository repository;

    public DataPacket load(DataKey key) {
        Objects.requireNonNull(key, "key must not be null");

        Map<String, Object> row =
                repository.load(key.getSchema(), key.getTable(), key.getBusinessKeys());

        DataPacket packet =
                new DataPacket(
                        key.getSchema(),
                        key.getTable()
                );

        packet.setAll(row);

        if (row.containsKey("id")) {
            packet.setBusinessKey("id", row.get("id"));
        }
        packet.attachRepository(repository);
        return packet;
    }

    public List<DataPacket> query(DataQuery query) {
        Objects.requireNonNull(query, "query must not be null");

        List<Map<String, Object>> rows =
                repository.query(query);

        List<DataPacket> packets = new ArrayList<>();

        for (Map<String, Object> row : rows) {

            DataPacket packet =
                    new DataPacket(
                            query.getSchema(),
                            query.getTable()
                    );

            packet.setAll(row);

            if (row.containsKey("id")) {
                packet.setBusinessKey("id", row.get("id"));
            }
            packet.attachRepository(repository);
            packets.add(packet);
        }

        return packets;
    }
}
