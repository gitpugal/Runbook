package com.runbook.engine.execution.datapacket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class JdbcDataPacketRepositoryTest {

    private JdbcDataPacketRepository repository;

    @BeforeEach
    void setUp() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        repository = new JdbcDataPacketRepository(jdbcTemplate);
    }

    @Test
    void queryRejectsInvalidTableIdentifier() {
        DataQuery query = new DataQuery("public", "users;DROP_TABLE", Map.of());
        assertThrows(IllegalArgumentException.class, () -> repository.query(query));
    }

    @Test
    void queryRejectsUnsupportedOperator() {
        DataQuery query = new DataQuery("public", "users", Map.of())
                .addFilter("name", "OR 1=1", "alice");

        assertThrows(IllegalArgumentException.class, () -> repository.query(query));
    }
}
