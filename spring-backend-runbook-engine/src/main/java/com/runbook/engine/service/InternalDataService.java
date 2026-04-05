package com.runbook.engine.service;

import com.runbook.engine.controller.dto.*;
import com.runbook.engine.domain.ColumnDefinition;
import com.runbook.engine.domain.ColumnType;
import com.runbook.engine.domain.DataDomain;
import com.runbook.engine.domain.EntityDefinition;
import com.runbook.engine.domain.InternalDataChangeType;
import com.runbook.engine.domain.Organization;
import com.runbook.engine.domain.OrganizationEnvironment;
import com.runbook.engine.domain.RelationshipDefinition;
import com.runbook.engine.domain.RelationshipType;
import com.runbook.engine.repository.ColumnDefinitionRepository;
import com.runbook.engine.repository.DataDomainRepository;
import com.runbook.engine.repository.EntityDefinitionRepository;
import com.runbook.engine.repository.OrganizationEnvironmentRepository;
import com.runbook.engine.repository.OrganizationRepository;
import com.runbook.engine.repository.RelationshipDefinitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class InternalDataService {

    private static final Pattern SQL_IDENTIFIER = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");
    private static final int DEFAULT_ROW_LIMIT = 200;

    private final OrganizationRepository organizationRepository;
    private final OrganizationEnvironmentRepository environmentRepository;
    private final DataDomainRepository domainRepository;
    private final EntityDefinitionRepository entityRepository;
    private final ColumnDefinitionRepository columnRepository;
    private final RelationshipDefinitionRepository relationshipRepository;
    private final JdbcTemplate jdbcTemplate;
    private final InternalDataWorkflowTriggerService triggerService;

    public OrganizationEnvironmentResponse createEnvironment(UUID organizationId, CreateInternalDataDomainRequest request) {
        return OrganizationEnvironmentResponse.from(ensureEnvironment(organizationId, request.getName()));
    }

    public EnvironmentDataResponse getEnvironment(UUID organizationId, UUID envId) {
        return
                EnvironmentDataResponse.builder()
                        .entities(listEntities(organizationId, envId))
                        .relationships(listRelationships(organizationId, envId))
                        .build();
    }

    public List<OrganizationEnvironmentResponse> getOrgEnvironment(UUID organizationId) {
        return environmentRepository.findByOrganization_Id(organizationId)
                .stream()
                .map(OrganizationEnvironmentResponse::from)
                .toList();
    }

    public InternalDataWorkspaceResponse getWorkspace(UUID organizationId) {
        return InternalDataWorkspaceResponse.builder()
                .environments(getOrgEnvironment(organizationId))
//                .domains(listDomains(organizationId))
//                .entities(listEntities(organizationId))
//                .relationships(listRelationships(organizationId))
                .build();
    }

    public DataDomainResponse createDomain(UUID organizationId, CreateInternalDataDomainRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Domain name is required");
        }

        DataDomain domain = domainRepository.save(
                DataDomain.builder()
                        .id(UUID.randomUUID())
//                        .environment(environment)
//                        .name(request.getName().trim())
//                        .description(blankToNull(request.getDescription()))
//                        .createdAt(Instant.now())
                        .build()
        );

        return DataDomainResponse.from(domain);
    }

    public List<DataDomainResponse> listDomains(UUID organizationId) {
        return domainRepository.findByEnvironment_Organization_IdOrderByNameAsc(organizationId).stream()
                .map(DataDomainResponse::from)
                .toList();
    }

    public EntityDefinitionResponse createEntity(UUID organizationId, CreateInternalEntityRequest request) {
        if (request.getTableName() == null || request.getTableName().isBlank()) {
            throw new IllegalArgumentException("Table name is required");
        }

        OrganizationEnvironment environment = ensureEnvironment(organizationId, request.getDomainId());
        String tableName = normalizeIdentifier(request.getTableName(), "table");

        if (entityRepository.existsByEnvironment_IdAndTableNameIgnoreCase(environment.getId(), tableName)) {
            throw new IllegalArgumentException("Table already exists in this environment");
        }


        EntityDefinition entity = entityRepository.save(
                EntityDefinition.builder()
                        .id(UUID.randomUUID())
                        .environment(environment)
                        .tableName(tableName)
                        .displayName(resolveDisplayName(request.getDisplayName(), tableName))
                        .createdAt(Instant.now())
                        .build()
        );

        List<ColumnDefinition> persistedColumns = new ArrayList<>();
        for (InternalColumnDefinitionRequest columnRequest : Optional.ofNullable(request.getColumns()).orElse(List.of())) {
            ColumnDefinition column = toColumnDefinition(columnRequest, entity);
            column.setId(UUID.randomUUID());
            column.setCreatedAt(Instant.now());
            persistedColumns.add(columnRepository.save(column));
        }

        jdbcTemplate.execute(buildCreateTableSql(environment.getSchemaName(), entity.getTableName(), persistedColumns));
        return toEntityResponse(entity, persistedColumns);
    }

    public List<EntityDefinitionResponse> listEntities(UUID organizationId, UUID envId) {
        return entityRepository.findByEnvironment_Organization_IdAndEnvironment_IdOrderByDisplayNameAsc(organizationId, envId).stream()
                .map(this::toEntityResponse)
                .toList();
    }

    public EntityDefinitionResponse addColumn(UUID organizationId, UUID entityId, InternalColumnDefinitionRequest request) {
        EntityDefinition entity = getEntityForOrganization(organizationId, entityId);
        String columnName = normalizeIdentifier(request.getColumnName(), "column");

        if (columnRepository.existsByEntity_IdAndColumnNameIgnoreCase(entity.getId(), columnName)) {
            throw new IllegalArgumentException("Column already exists");
        }

        ColumnDefinition column = toColumnDefinition(request, entity);
        column.setId(UUID.randomUUID());
        column.setCreatedAt(Instant.now());
        ColumnDefinition savedColumn = columnRepository.save(column);

        String tableReference = qualify(entity.getEnvironment().getSchemaName(), entity.getTableName());
        jdbcTemplate.execute("ALTER TABLE " + tableReference + " ADD COLUMN " + buildColumnSql(savedColumn));

        if (savedColumn.isUniqueColumn()) {
            jdbcTemplate.execute(buildUniqueConstraintSql(entity, savedColumn.getColumnName()));
        }

        if (savedColumn.getType() == ColumnType.REFERENCE) {
            jdbcTemplate.execute(buildIndexSql(entity.getEnvironment().getSchemaName(), entity.getTableName(), savedColumn.getColumnName()));
        }

        return toEntityResponse(entity);
    }

    public RelationshipDefinitionResponse createRelationship(UUID organizationId, CreateInternalRelationshipRequest request) {
        EntityDefinition sourceEntity = getEntityForOrganization(organizationId, request.getSourceEntityId());
        EntityDefinition targetEntity = getEntityForOrganization(organizationId, request.getTargetEntityId());
        RelationshipType relationshipType = Objects.requireNonNull(request.getType(), "Relationship type is required");
        String targetColumn = request.getTargetColumn() == null || request.getTargetColumn().isBlank()
                ? "id"
                : normalizeIdentifier(request.getTargetColumn(), "target column");

        if (!"id".equalsIgnoreCase(targetColumn)
                && columnRepository.findByEntity_IdAndColumnName(targetEntity.getId(), targetColumn).isEmpty()) {
            throw new IllegalArgumentException("Target column does not exist");
        }

        EntityDefinition referencingEntity;
        EntityDefinition referencedEntity;
        String fkColumn;

        if (relationshipType == RelationshipType.ONE_TO_MANY) {
            referencingEntity = targetEntity;
            referencedEntity = sourceEntity;
            fkColumn = normalizeIdentifier(
                    request.getSourceColumn() == null || request.getSourceColumn().isBlank()
                            ? sourceEntity.getTableName() + "_id"
                            : request.getSourceColumn(),
                    "source column"
            );
        } else {
            referencingEntity = sourceEntity;
            referencedEntity = targetEntity;
            fkColumn = normalizeIdentifier(
                    request.getSourceColumn() == null || request.getSourceColumn().isBlank()
                            ? targetEntity.getTableName() + "_id"
                            : request.getSourceColumn(),
                    "source column"
            );
        }

        ensureReferenceColumnExists(referencingEntity, fkColumn);
        jdbcTemplate.execute(buildAddColumnIfMissingSql(referencingEntity.getEnvironment().getSchemaName(), referencingEntity.getTableName(), fkColumn));
        jdbcTemplate.execute(buildForeignKeySql(referencingEntity, fkColumn, referencedEntity, targetColumn));
        jdbcTemplate.execute(buildIndexSql(referencingEntity.getEnvironment().getSchemaName(), referencingEntity.getTableName(), fkColumn));

        if (relationshipType == RelationshipType.ONE_TO_ONE) {
            jdbcTemplate.execute(buildUniqueConstraintSql(referencingEntity, fkColumn));
        }

        RelationshipDefinition relationship = relationshipRepository.save(
                RelationshipDefinition.builder()
                        .id(UUID.randomUUID())
                        .sourceEntity(sourceEntity)
                        .targetEntity(targetEntity)
                        .type(relationshipType)
                        .sourceColumn(fkColumn)
                        .targetColumn(targetColumn)
                        .build()
        );

        return RelationshipDefinitionResponse.from(relationship);
    }

    public List<RelationshipDefinitionResponse> listRelationships(UUID organizationId, UUID envId) {
        return relationshipRepository.findAllForOrganization(organizationId, envId).stream()
                .map(RelationshipDefinitionResponse::from)
                .toList();
    }

    public List<String> listInternalTables(UUID organizationId) {
        return entityRepository.findByEnvironment_Organization_IdOrderByDisplayNameAsc(organizationId).stream()
                .map(EntityDefinition::getTableName)
                .toList();
    }

    public TableSchemaDTO getInternalTableSchema(UUID organizationId, String tableName) {
        EntityDefinition entity = entityRepository.findByEnvironment_Organization_IdAndTableName(organizationId, normalizeIdentifier(tableName, "table"))
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));

        List<TableColumnDTO> columns = new ArrayList<>();
        columns.add(new TableColumnDTO("id", "string", allowedOperators("string"), false));

        for (ColumnDefinition definition : columnRepository.findByEntity_IdOrderByCreatedAtAsc(entity.getId())) {
            String frontendType = mapFrontendType(definition.getType());
            columns.add(new TableColumnDTO(definition.getColumnName(), frontendType, allowedOperators(frontendType), true));
        }

        columns.add(new TableColumnDTO("created_at", "date", allowedOperators("date"), false));
        columns.add(new TableColumnDTO("updated_at", "date", allowedOperators("date"), false));

        return new TableSchemaDTO(entity.getTableName(), "id", columns);
    }

    public InternalDataRowsResponse listRows(
            UUID organizationId,
            UUID entityId,
            String filterColumn,
            String filterValue,
            String sortBy,
            String sortDirection,
            Integer limit
    ) {
        EntityDefinition entity = getEntityForOrganization(organizationId, entityId);
        StringBuilder sql = new StringBuilder("SELECT * FROM ")
                .append(qualify(entity.getEnvironment().getSchemaName(), entity.getTableName()));
        List<Object> params = new ArrayList<>();

        if (filterColumn != null && !filterColumn.isBlank() && filterValue != null) {
            String normalizedFilterColumn = normalizeIdentifier(filterColumn, "filter column");
            assertKnownColumn(entity, normalizedFilterColumn);
            sql.append(" WHERE ").append(normalizedFilterColumn).append(" = ?");
            params.add(convertValue(resolveColumnType(entity, normalizedFilterColumn), filterValue));
        }

        String orderColumn = sortBy == null || sortBy.isBlank() ? "created_at" : normalizeIdentifier(sortBy, "sort column");
        assertKnownColumn(entity, orderColumn);
        String direction = "ASC".equalsIgnoreCase(sortDirection) ? "ASC" : "DESC";
        sql.append(" ORDER BY ").append(orderColumn).append(" ").append(direction);
        sql.append(" LIMIT ").append(Math.min(limit == null ? DEFAULT_ROW_LIMIT : limit, 500));

        return InternalDataRowsResponse.builder()
                .rows(jdbcTemplate.queryForList(sql.toString(), params.toArray()))
                .build();
    }

    public Map<String, Object> insertRow(UUID organizationId, UUID entityId, InternalRowUpsertRequest request) {
        EntityDefinition entity = getEntityForOrganization(organizationId, entityId);
        Map<String, Object> incomingValues = new LinkedHashMap<>(Optional.ofNullable(request.getValues()).orElse(Map.of()));
        Map<String, Object> allowedValues = new LinkedHashMap<>();

        for (ColumnDefinition definition : columnRepository.findByEntity_IdOrderByCreatedAtAsc(entity.getId())) {
            if (!incomingValues.containsKey(definition.getColumnName())) {
                continue;
            }
            allowedValues.put(definition.getColumnName(), convertValue(definition.getType(), incomingValues.get(definition.getColumnName())));
        }

        UUID rowId = incomingValues.containsKey("id")
                ? UUID.fromString(incomingValues.get("id").toString())
                : UUID.randomUUID();

        StringBuilder sql = new StringBuilder("INSERT INTO ")
                .append(qualify(entity.getEnvironment().getSchemaName(), entity.getTableName()))
                .append(" (id");
        List<Object> params = new ArrayList<>();
        params.add(rowId);

        for (String columnName : allowedValues.keySet()) {
            sql.append(", ").append(columnName);
        }

        sql.append(") VALUES (?)");
        for (Object value : allowedValues.values()) {
            sql.insert(sql.length() - 1, ", ?");
            params.add(value);
        }

        jdbcTemplate.update(sql.toString(), params.toArray());
        Map<String, Object> row = getRowById(entity, rowId);
        triggerService.triggerMatchingWorkflows(organizationId, entity.getEnvironment().getSchemaName(), entity.getTableName(), InternalDataChangeType.ROW_INSERT, row);
        return row;
    }

    public Map<String, Object> updateRow(UUID organizationId, UUID entityId, UUID rowId, InternalRowUpsertRequest request) {
        EntityDefinition entity = getEntityForOrganization(organizationId, entityId);
        Map<String, Object> values = Optional.ofNullable(request.getValues()).orElse(Map.of());
        if (values.isEmpty()) {
            return getRowById(entity, rowId);
        }

        StringBuilder sql = new StringBuilder("UPDATE ")
                .append(qualify(entity.getEnvironment().getSchemaName(), entity.getTableName()))
                .append(" SET ");
        List<Object> params = new ArrayList<>();
        int index = 0;

        for (Map.Entry<String, Object> entry : values.entrySet()) {
            String columnName = normalizeIdentifier(entry.getKey(), "column");
            if (Set.of("id", "created_at", "updated_at").contains(columnName)) {
                continue;
            }

            assertKnownColumn(entity, columnName);

            if (index++ > 0) {
                sql.append(", ");
            }

            sql.append(columnName).append(" = ?");
            params.add(convertValue(resolveColumnType(entity, columnName), entry.getValue()));
        }

        if (index == 0) {
            return getRowById(entity, rowId);
        }

        sql.append(", updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        params.add(rowId);
        jdbcTemplate.update(sql.toString(), params.toArray());

        Map<String, Object> row = getRowById(entity, rowId);
        triggerService.triggerMatchingWorkflows(organizationId, entity.getEnvironment().getSchemaName(), entity.getTableName(), InternalDataChangeType.ROW_UPDATE, row);
        return row;
    }

    public void deleteRow(UUID organizationId, UUID entityId, UUID rowId) {
        EntityDefinition entity = getEntityForOrganization(organizationId, entityId);
        Map<String, Object> row = getRowById(entity, rowId);
        jdbcTemplate.update("DELETE FROM " + qualify(entity.getEnvironment().getSchemaName(), entity.getTableName()) + " WHERE id = ?", rowId);
        triggerService.triggerMatchingWorkflows(organizationId, entity.getEnvironment().getSchemaName(), entity.getTableName(), InternalDataChangeType.ROW_DELETE, row);
    }

    private OrganizationEnvironment ensureEnvironment(UUID organizationId, String domain_name) {
        OrganizationEnvironment existing = environmentRepository.findByOrganization_IdAndName(organizationId, domain_name);
        if (existing != null)
            throw new RuntimeException("Schema with same name already exists, Try a different name");
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));
        String schemaName = buildSchemaName(organizationId, domain_name);
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + normalizeIdentifier(schemaName, "schema"));
        return environmentRepository.save(
                OrganizationEnvironment.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .schemaName(schemaName)
                        .createdAt(Instant.now())
                        .build()
        );
    }

    private OrganizationEnvironment ensureEnvironment(UUID organizationId, UUID schemaId) {
        return environmentRepository.findByOrganization_IdAndId(organizationId, schemaId);
    }

    private EntityDefinition getEntityForOrganization(UUID organizationId, UUID entityId) {
        return entityRepository.findByIdAndEnvironment_Organization_Id(entityId, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Entity not found"));
    }

    private EntityDefinitionResponse toEntityResponse(EntityDefinition entity) {
        List<ColumnDefinition> columns = columnRepository.findByEntity_IdOrderByCreatedAtAsc(entity.getId());
        return toEntityResponse(entity, columns);
    }

    private EntityDefinitionResponse toEntityResponse(EntityDefinition entity, List<ColumnDefinition> columns) {
        return EntityDefinitionResponse.from(entity, columns.stream().map(ColumnDefinitionResponse::from).toList());
    }

    private ColumnDefinition toColumnDefinition(InternalColumnDefinitionRequest request, EntityDefinition entity) {
        if (request.getColumnName() == null || request.getColumnName().isBlank()) {
            throw new IllegalArgumentException("Column name is required");
        }
        if (request.getType() == null) {
            throw new IllegalArgumentException("Column type is required");
        }

        return ColumnDefinition.builder()
                .entity(entity)
                .columnName(normalizeIdentifier(request.getColumnName(), "column"))
                .displayName(resolveDisplayName(request.getDisplayName(), request.getColumnName()))
                .type(request.getType())
                .required(Boolean.TRUE.equals(request.getRequired()))
                .uniqueColumn(Boolean.TRUE.equals(request.getUnique()))
                .defaultValue(blankToNull(request.getDefaultValue()))
                .build();
    }

    private void ensureReferenceColumnExists(EntityDefinition entity, String columnName) {
        if (columnRepository.existsByEntity_IdAndColumnNameIgnoreCase(entity.getId(), columnName)) {
            return;
        }

        columnRepository.save(
                ColumnDefinition.builder()
                        .id(UUID.randomUUID())
                        .entity(entity)
                        .columnName(columnName)
                        .displayName(toTitleCase(columnName))
                        .type(ColumnType.REFERENCE)
                        .required(false)
                        .uniqueColumn(false)
                        .createdAt(Instant.now())
                        .build()
        );
    }

    private Map<String, Object> getRowById(EntityDefinition entity, UUID rowId) {
        return jdbcTemplate.queryForMap("SELECT * FROM " + qualify(entity.getEnvironment().getSchemaName(), entity.getTableName()) + " WHERE id = ?", rowId);
    }

    private String buildCreateTableSql(String schemaName, String tableName, List<ColumnDefinition> columns) {
        StringBuilder sql = new StringBuilder("CREATE TABLE ")
                .append(qualify(schemaName, tableName))
                .append(" (id UUID PRIMARY KEY");

        for (ColumnDefinition column : columns) {
            sql.append(", ").append(buildColumnSql(column));
        }

        sql.append(", created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        sql.append(", updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        sql.append(")");
        log.debug("=====================================" + sql.toString());
        return sql.toString();
    }

    private String buildColumnSql(ColumnDefinition column) {
        StringBuilder sql = new StringBuilder()
                .append(normalizeIdentifier(column.getColumnName(), "column"))
                .append(" ")
                .append(sqlType(column.getType()));

        if (column.isRequired()) {
            sql.append(" NOT NULL");
        }

        if (column.isUniqueColumn()) {
            sql.append(" UNIQUE");
        }

        if (column.getDefaultValue() != null && !column.getDefaultValue().isBlank()) {
            sql.append(" DEFAULT ").append(formatDefaultValue(column.getType(), column.getDefaultValue()));
        }

        return sql.toString();
    }

    private String buildAddColumnIfMissingSql(String schemaName, String tableName, String columnName) {
        return "ALTER TABLE " + qualify(schemaName, tableName)
                + " ADD COLUMN IF NOT EXISTS " + normalizeIdentifier(columnName, "column") + " UUID";
    }

    private String buildForeignKeySql(EntityDefinition referencingEntity, String sourceColumn, EntityDefinition referencedEntity, String targetColumn) {
        String constraintName = shortenName("fk_" + referencingEntity.getTableName() + "_" + sourceColumn);
        return """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = '%s'
                    ) THEN
                        ALTER TABLE %s
                        ADD CONSTRAINT %s
                        FOREIGN KEY (%s)
                        REFERENCES %s(%s);
                    END IF;
                END $$;
                """.formatted(
                constraintName,
                qualify(referencingEntity.getEnvironment().getSchemaName(), referencingEntity.getTableName()),
                constraintName,
                normalizeIdentifier(sourceColumn, "source column"),
                qualify(referencedEntity.getEnvironment().getSchemaName(), referencedEntity.getTableName()),
                normalizeIdentifier(targetColumn, "target column")
        );
    }

    private String buildUniqueConstraintSql(EntityDefinition entity, String columnName) {
        String constraintName = shortenName("uq_" + entity.getTableName() + "_" + columnName);
        return """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = '%s'
                    ) THEN
                        ALTER TABLE %s
                        ADD CONSTRAINT %s
                        UNIQUE (%s);
                    END IF;
                END $$;
                """.formatted(
                constraintName,
                qualify(entity.getEnvironment().getSchemaName(), entity.getTableName()),
                constraintName,
                normalizeIdentifier(columnName, "column")
        );
    }

    private String buildIndexSql(String schemaName, String tableName, String columnName) {
        String indexName = shortenName("idx_" + tableName + "_" + columnName);
        return "CREATE INDEX IF NOT EXISTS " + indexName
                + " ON " + qualify(schemaName, tableName)
                + " (" + normalizeIdentifier(columnName, "column") + ")";
    }

    private String sqlType(ColumnType columnType) {
        return switch (columnType) {
            case TEXT, EMAIL -> "TEXT";
            case NUMBER -> "INTEGER";
            case BOOLEAN -> "BOOLEAN";
            case DATE -> "DATE";
            case DATETIME -> "TIMESTAMP";
            case UUID, REFERENCE -> "UUID";
        };
    }

    private String formatDefaultValue(ColumnType columnType, String defaultValue) {
        return switch (columnType) {
            case NUMBER, BOOLEAN -> defaultValue.trim();
            case UUID, REFERENCE -> "'" + UUID.fromString(defaultValue.trim()) + "'";
            case DATE -> "'" + LocalDate.parse(defaultValue.trim()) + "'";
            case DATETIME -> "'" + Timestamp.valueOf(LocalDateTime.parse(defaultValue.trim())) + "'";
            case TEXT, EMAIL -> "'" + defaultValue.replace("'", "''") + "'";
        };
    }

    private String mapFrontendType(ColumnType type) {
        return switch (type) {
            case NUMBER -> "number";
            case BOOLEAN -> "boolean";
            case DATE, DATETIME -> "date";
            default -> "string";
        };
    }

    private List<String> allowedOperators(String type) {
        return switch (type) {
            case "number", "date" -> List.of("=", "!=", ">", "<", ">=", "<=");
            case "boolean" -> List.of("=");
            default -> List.of("=", "!=", "LIKE", "ILIKE");
        };
    }

    private void assertKnownColumn(EntityDefinition entity, String columnName) {
        if (Set.of("id", "created_at", "updated_at").contains(columnName)) {
            return;
        }

        if (!columnRepository.existsByEntity_IdAndColumnNameIgnoreCase(entity.getId(), columnName)) {
            throw new IllegalArgumentException("Unknown column: " + columnName);
        }
    }

    private ColumnType resolveColumnType(EntityDefinition entity, String columnName) {
        return switch (columnName) {
            case "id" -> ColumnType.UUID;
            case "created_at", "updated_at" -> ColumnType.DATETIME;
            default -> columnRepository.findByEntity_IdAndColumnName(entity.getId(), columnName)
                    .map(ColumnDefinition::getType)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown column: " + columnName));
        };
    }

    private Object convertValue(ColumnType columnType, Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof UUID || value instanceof Boolean || value instanceof Number
                || value instanceof Timestamp || value instanceof LocalDate || value instanceof LocalDateTime) {
            return value;
        }

        String stringValue = value.toString().trim();
        if (stringValue.isBlank()) {
            return null;
        }

        return switch (columnType) {
            case NUMBER -> Integer.parseInt(stringValue);
            case BOOLEAN -> Boolean.parseBoolean(stringValue);
            case DATE -> LocalDate.parse(stringValue);
            case DATETIME -> Timestamp.valueOf(LocalDateTime.parse(stringValue));
            case UUID, REFERENCE -> UUID.fromString(stringValue);
            case TEXT, EMAIL -> stringValue;
        };
    }

    private String buildSchemaName(UUID organizationId, String dom) {
        return "runbook_org_" + organizationId.toString().replace("-", "") + "_" + dom;
    }

    private String qualify(String schemaName, String tableName) {
        return normalizeIdentifier(schemaName, "schema") + "." + normalizeIdentifier(tableName, "table");
    }

    private String normalizeIdentifier(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT).replace(" ", "_").replace("-", "_");
        if (!SQL_IDENTIFIER.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Invalid " + label + ": " + value);
        }

        return normalized;
    }

    private String resolveDisplayName(String displayName, String fallbackIdentifier) {
        return displayName == null || displayName.isBlank()
                ? toTitleCase(fallbackIdentifier)
                : displayName.trim();
    }

    private String toTitleCase(String value) {
        String[] parts = value.replace("_", " ").trim().split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (int index = 0; index < parts.length; index++) {
            String part = parts[index];
            if (part.isBlank()) {
                continue;
            }
            if (index > 0) {
                builder.append(" ");
            }
            builder.append(part.substring(0, 1).toUpperCase(Locale.ROOT))
                    .append(part.substring(1).toLowerCase(Locale.ROOT));
        }
        return builder.toString();
    }

    private String shortenName(String value) {
        String normalized = normalizeIdentifier(value, "identifier");
        return normalized.length() <= 63 ? normalized : normalized.substring(0, 63);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
