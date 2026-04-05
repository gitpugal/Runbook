package com.runbook.engine.service;

import com.runbook.engine.controller.dto.CreateInternalDataDomainRequest;
import com.runbook.engine.controller.dto.CreateInternalEntityRequest;
import com.runbook.engine.controller.dto.CreateInternalRelationshipRequest;
import com.runbook.engine.controller.dto.InternalColumnDefinitionRequest;
import com.runbook.engine.controller.dto.InternalRowUpsertRequest;
import com.runbook.engine.domain.ColumnDefinition;
import com.runbook.engine.domain.ColumnType;
import com.runbook.engine.domain.DataDomain;
import com.runbook.engine.domain.EntityDefinition;
import com.runbook.engine.domain.Organization;
import com.runbook.engine.domain.OrganizationEnvironment;
import com.runbook.engine.domain.RelationshipType;
import com.runbook.engine.repository.ColumnDefinitionRepository;
import com.runbook.engine.repository.DataDomainRepository;
import com.runbook.engine.repository.EntityDefinitionRepository;
import com.runbook.engine.repository.OrganizationEnvironmentRepository;
import com.runbook.engine.repository.OrganizationRepository;
import com.runbook.engine.repository.RelationshipDefinitionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InternalDataServiceTest {

    private OrganizationRepository organizationRepository;
    private OrganizationEnvironmentRepository environmentRepository;
    private DataDomainRepository domainRepository;
    private EntityDefinitionRepository entityRepository;
    private ColumnDefinitionRepository columnRepository;
    private RelationshipDefinitionRepository relationshipRepository;
    private JdbcTemplate jdbcTemplate;
    private InternalDataWorkflowTriggerService triggerService;
    private InternalDataService service;

    private UUID organizationId;
    private OrganizationEnvironment environment;

    @BeforeEach
    void setUp() {
        organizationRepository = mock(OrganizationRepository.class);
        environmentRepository = mock(OrganizationEnvironmentRepository.class);
        domainRepository = mock(DataDomainRepository.class);
        entityRepository = mock(EntityDefinitionRepository.class);
        columnRepository = mock(ColumnDefinitionRepository.class);
        relationshipRepository = mock(RelationshipDefinitionRepository.class);
        jdbcTemplate = mock(JdbcTemplate.class);
        triggerService = mock(InternalDataWorkflowTriggerService.class);

        service = new InternalDataService(
                organizationRepository,
                environmentRepository,
                domainRepository,
                entityRepository,
                columnRepository,
                relationshipRepository,
                jdbcTemplate,
                triggerService
        );

        organizationId = UUID.randomUUID();
        Organization organization = new Organization();
        organization.setId(organizationId);
        organization.setName("Axiom");

        environment = OrganizationEnvironment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .schemaName("runbook_org_" + organizationId.toString().replace("-", ""))
                .createdAt(Instant.now())
                .build();

        when(environmentRepository.findByOrganization_Id(organizationId)).thenReturn(Optional.of(environment));
    }

    @Test
    void createDomainPersistsDomainAgainstEnvironment() {
        CreateInternalDataDomainRequest request = new CreateInternalDataDomainRequest();
        request.setName("Customer Success");
        request.setDescription("CS owned entities");

        DataDomain saved = DataDomain.builder()
                .id(UUID.randomUUID())
                .environment(environment)
                .name(request.getName())
                .description(request.getDescription())
                .createdAt(Instant.now())
                .build();

        when(domainRepository.save(any(DataDomain.class))).thenReturn(saved);

        assertEquals("Customer Success", service.createDomain(organizationId, request).name());
        verify(domainRepository).save(any(DataDomain.class));
    }

    @Test
    void createEntityCreatesPhysicalTableAndMetadata() {
        CreateInternalEntityRequest request = new CreateInternalEntityRequest();
        request.setTableName("customers");
        request.setDisplayName("Customers");

        InternalColumnDefinitionRequest emailColumn = new InternalColumnDefinitionRequest();
        emailColumn.setColumnName("email");
        emailColumn.setDisplayName("Email");
        emailColumn.setType(ColumnType.EMAIL);
        emailColumn.setRequired(true);
        request.setColumns(List.of(emailColumn));

        EntityDefinition entity = EntityDefinition.builder()
                .id(UUID.randomUUID())
                .environment(environment)
                .tableName("customers")
                .displayName("Customers")
                .createdAt(Instant.now())
                .build();

        when(entityRepository.existsByEnvironment_IdAndTableNameIgnoreCase(environment.getId(), "customers")).thenReturn(false);
        when(entityRepository.save(any(EntityDefinition.class))).thenReturn(entity);
        when(columnRepository.save(any(ColumnDefinition.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals("customers", service.createEntity(organizationId, request).tableName());
        verify(jdbcTemplate).execute(eq("CREATE TABLE " + environment.getSchemaName() + ".customers (id UUID PRIMARY KEY, email TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)"));
    }

    @Test
    void addColumnAltersPhysicalTable() {
        UUID entityId = UUID.randomUUID();
        EntityDefinition entity = EntityDefinition.builder()
                .id(entityId)
                .environment(environment)
                .tableName("customers")
                .displayName("Customers")
                .createdAt(Instant.now())
                .build();

        when(entityRepository.findByIdAndEnvironment_Organization_Id(entityId, organizationId)).thenReturn(Optional.of(entity));
        when(columnRepository.existsByEntity_IdAndColumnNameIgnoreCase(entityId, "health_score")).thenReturn(false);
        when(columnRepository.save(any(ColumnDefinition.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(columnRepository.findByEntity_IdOrderByCreatedAtAsc(entityId)).thenReturn(List.of());

        InternalColumnDefinitionRequest request = new InternalColumnDefinitionRequest();
        request.setColumnName("health_score");
        request.setType(ColumnType.NUMBER);

        service.addColumn(organizationId, entityId, request);

        verify(jdbcTemplate).execute(eq("ALTER TABLE " + environment.getSchemaName() + ".customers ADD COLUMN health_score INTEGER"));
    }

    @Test
    void createRelationshipAddsForeignKeyToTargetTableForOneToMany() {
        EntityDefinition customers = EntityDefinition.builder()
                .id(UUID.randomUUID())
                .environment(environment)
                .tableName("customers")
                .displayName("Customers")
                .createdAt(Instant.now())
                .build();

        EntityDefinition subscriptions = EntityDefinition.builder()
                .id(UUID.randomUUID())
                .environment(environment)
                .tableName("subscriptions")
                .displayName("Subscriptions")
                .createdAt(Instant.now())
                .build();

        when(entityRepository.findByIdAndEnvironment_Organization_Id(customers.getId(), organizationId)).thenReturn(Optional.of(customers));
        when(entityRepository.findByIdAndEnvironment_Organization_Id(subscriptions.getId(), organizationId)).thenReturn(Optional.of(subscriptions));
        when(columnRepository.existsByEntity_IdAndColumnNameIgnoreCase(subscriptions.getId(), "customer_id")).thenReturn(false);
        when(columnRepository.save(any(ColumnDefinition.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(relationshipRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CreateInternalRelationshipRequest request = new CreateInternalRelationshipRequest();
        request.setSourceEntityId(customers.getId());
        request.setTargetEntityId(subscriptions.getId());
        request.setType(RelationshipType.ONE_TO_MANY);
        request.setSourceColumn("customer_id");

        assertEquals("customer_id", service.createRelationship(organizationId, request).sourceColumn());
        verify(jdbcTemplate).execute(eq("ALTER TABLE " + environment.getSchemaName() + ".subscriptions ADD COLUMN IF NOT EXISTS customer_id UUID"));
    }

    @Test
    void insertRowStoresDataAndPublishesInsertTrigger() {
        UUID entityId = UUID.randomUUID();
        EntityDefinition entity = EntityDefinition.builder()
                .id(entityId)
                .environment(environment)
                .tableName("customers")
                .displayName("Customers")
                .createdAt(Instant.now())
                .build();

        ColumnDefinition emailColumn = ColumnDefinition.builder()
                .id(UUID.randomUUID())
                .entity(entity)
                .columnName("email")
                .displayName("Email")
                .type(ColumnType.EMAIL)
                .required(true)
                .createdAt(Instant.now())
                .build();

        when(entityRepository.findByIdAndEnvironment_Organization_Id(entityId, organizationId)).thenReturn(Optional.of(entity));
        when(columnRepository.findByEntity_IdOrderByCreatedAtAsc(entityId)).thenReturn(List.of(emailColumn));

        Map<String, Object> insertedRow = new LinkedHashMap<>();
        insertedRow.put("id", UUID.randomUUID());
        insertedRow.put("email", "alice@example.com");
        when(jdbcTemplate.queryForMap(any(String.class), any(UUID.class))).thenReturn(insertedRow);

        InternalRowUpsertRequest request = new InternalRowUpsertRequest();
        request.setValues(Map.of("email", "alice@example.com"));

        assertEquals("alice@example.com", service.insertRow(organizationId, entityId, request).get("email"));
        verify(triggerService).triggerMatchingWorkflows(eq(organizationId), eq(environment.getSchemaName()), eq("customers"), any(), eq(insertedRow));
    }

    @Test
    void listRowsQueriesOrganizationScopedTable() {
        UUID entityId = UUID.randomUUID();
        EntityDefinition entity = EntityDefinition.builder()
                .id(entityId)
                .environment(environment)
                .tableName("customers")
                .displayName("Customers")
                .createdAt(Instant.now())
                .build();

        ColumnDefinition emailColumn = ColumnDefinition.builder()
                .id(UUID.randomUUID())
                .entity(entity)
                .columnName("email")
                .displayName("Email")
                .type(ColumnType.EMAIL)
                .required(true)
                .createdAt(Instant.now())
                .build();

        when(entityRepository.findByIdAndEnvironment_Organization_Id(entityId, organizationId)).thenReturn(Optional.of(entity));
        when(columnRepository.existsByEntity_IdAndColumnNameIgnoreCase(entityId, "email")).thenReturn(true);
        when(columnRepository.findByEntity_IdAndColumnName(entityId, "email")).thenReturn(Optional.of(emailColumn));
        when(jdbcTemplate.queryForList(any(String.class), any(Object[].class)))
                .thenReturn(List.of(Map.of("email", "alice@example.com")));

        var response = service.listRows(organizationId, entityId, "email", "alice@example.com", "email", "ASC", 25);

        assertEquals(1, response.rows().size());
        verify(jdbcTemplate).queryForList(
                eq("SELECT * FROM " + environment.getSchemaName() + ".customers WHERE email = ? ORDER BY email ASC LIMIT 25"),
                any(Object[].class)
        );
    }
}
