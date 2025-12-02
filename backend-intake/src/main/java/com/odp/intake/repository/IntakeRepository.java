package com.odp.intake.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;

@Repository
public class IntakeRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Save project details
     */
    public void saveProjectDetails(String intakeId, Map<String, Object> projectDetails) {
        String sql = """
            INSERT INTO metadata.intake_projects (
                intake_id, edai_req_id, fund_type, fund_value, business_line, sub_domain, domain,
                project_name, project_description, tech_owner_email, developer_email,
                exp_dev_date, exp_it_date, uat_date, prod_date, components
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(sql,
            intakeId,
            getString(projectDetails, "edaiReqId"),
            getString(projectDetails, "fundType"),
            getString(projectDetails, "fundValue"),
            getString(projectDetails, "businessLine"),
            getString(projectDetails, "subDomain"),
            getString(projectDetails, "domain"),
            getString(projectDetails, "projectName"),
            getString(projectDetails, "projectDescription"),
            getString(projectDetails, "techOwnerEmail"),
            getString(projectDetails, "developerEmail"),
            getDate(projectDetails, "expDevDate"),
            getDate(projectDetails, "expITDate"),
            getDate(projectDetails, "uatDate"),
            getDate(projectDetails, "prodDate"),
            getString(projectDetails, "components")
        );
    }

    /**
     * Save Cassandra entity with generated CQL
     */
    public Long saveCassandraEntity(String intakeId, Map<String, Object> entity, Map<String, Object> modelingResult) {
        String sql = """
            INSERT INTO metadata.intake_cassandra_entities (
                intake_id, entity_name, entity_description, sor_of_data, retention,
                total_record, record_size_bytes, volume_gb_current_yr, volume_gb_5_years,
                keyspace, csv_schema, field_attributes, access_patterns, constraints_settings,
                generated_cql, partition_key, clustering_keys, indexes, warnings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb)
            RETURNING id
            """;

        Long entityId = jdbcTemplate.queryForObject(sql, Long.class,
            intakeId,
            getString(entity, "entityName"),
            getString(entity, "entityDescription"),
            getString(entity, "sorOfData"),
            getString(entity, "retention"),
            getLong(entity, "totalRecord"),
            getLong(entity, "recordSizeBytes"),
            getDecimal(entity, "volumeGbCurrentYr"),
            getDecimal(entity, "volumeGb5Years"),
            getString(entity, "keyspace"),
            toJsonString(entity.get("csvFields")),
            toJsonString(entity.get("fieldAttributes")),
            toJsonString(entity.get("accessPatterns")),
            toJsonString(entity.get("constraints")),
            modelingResult != null ? getString(modelingResult, "createTableCql") : null,
            toJsonString(modelingResult != null ? modelingResult.get("partitionKey") : null),
            toJsonString(modelingResult != null ? modelingResult.get("clusteringKeys") : null),
            toJsonString(modelingResult != null ? modelingResult.get("indexes") : null),
            toJsonString(modelingResult != null ? modelingResult.get("warnings") : null)
        );

        return entityId;
    }

    /**
     * Save API details
     */
    public void saveApiDetails(String intakeId, Long entityId, Map<String, Object> apiDetail) {
        String sql = """
            INSERT INTO metadata.intake_api_details (
                intake_id, entity_id, pattern_id, access_pattern, description,
                average_tps, peak_tps, sla_in_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(sql,
            intakeId,
            entityId, // Can be null for manual entries
            getString(apiDetail, "patternId"),
            getString(apiDetail, "accessPattern"),
            getString(apiDetail, "description"),
            getInteger(apiDetail, "averageTPS"),
            getInteger(apiDetail, "peakTPS"),
            getInteger(apiDetail, "slaInMs")
        );
    }

    // Helper methods
    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private java.sql.Date getDate(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof java.sql.Date) {
            return (java.sql.Date) value;
        }
        if (value instanceof java.util.Date) {
            return new java.sql.Date(((java.util.Date) value).getTime());
        }
        // Try to parse string date
        try {
            return java.sql.Date.valueOf(value.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private java.math.BigDecimal getDecimal(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return java.math.BigDecimal.valueOf(((Number) value).doubleValue());
        }
        try {
            return new java.math.BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String toJsonString(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert object to JSON", e);
        }
    }

    /**
     * Initialize database tables on startup
     */
    public void initializeTables() {
        try {
            // Create schema if it doesn't exist
            jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS metadata");
            
            // Project Details Table
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS metadata.intake_projects (
                    intake_id VARCHAR(255) PRIMARY KEY,
                    edai_req_id VARCHAR(255),
                    fund_type VARCHAR(50),
                    fund_value VARCHAR(255),
                    business_line VARCHAR(255),
                    sub_domain VARCHAR(255),
                    domain VARCHAR(255),
                    project_name VARCHAR(255),
                    project_description TEXT,
                    tech_owner_email VARCHAR(255),
                    developer_email VARCHAR(255),
                    exp_dev_date DATE,
                    exp_it_date DATE,
                    uat_date DATE,
                    prod_date DATE,
                    components VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);

            // Cassandra Entities Table
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS metadata.intake_cassandra_entities (
                    id BIGSERIAL PRIMARY KEY,
                    intake_id VARCHAR(255) NOT NULL REFERENCES metadata.intake_projects(intake_id) ON DELETE CASCADE,
                    entity_name VARCHAR(255) NOT NULL,
                    entity_description TEXT,
                    sor_of_data VARCHAR(255),
                    retention VARCHAR(255),
                    total_record BIGINT,
                    record_size_bytes BIGINT,
                    volume_gb_current_yr DECIMAL(15,2),
                    volume_gb_5_years DECIMAL(15,2),
                    keyspace VARCHAR(255),
                    csv_schema JSONB,
                    field_attributes JSONB,
                    access_patterns JSONB,
                    constraints_settings JSONB,
                    generated_cql TEXT,
                    partition_key JSONB,
                    clustering_keys JSONB,
                    indexes JSONB,
                    warnings JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);

            // API Details Table
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS metadata.intake_api_details (
                    id BIGSERIAL PRIMARY KEY,
                    intake_id VARCHAR(255) NOT NULL REFERENCES metadata.intake_projects(intake_id) ON DELETE CASCADE,
                    entity_id BIGINT REFERENCES metadata.intake_cassandra_entities(id) ON DELETE CASCADE,
                    pattern_id VARCHAR(255),
                    access_pattern VARCHAR(255) NOT NULL,
                    description TEXT,
                    average_tps INTEGER,
                    peak_tps INTEGER,
                    sla_in_ms INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);

            // Create indexes (ignore errors if they already exist)
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_intake_projects_edai_req_id ON metadata.intake_projects(edai_req_id)");
            } catch (Exception e) { /* Ignore */ }
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_intake_projects_project_name ON metadata.intake_projects(project_name)");
            } catch (Exception e) { /* Ignore */ }
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_intake_cassandra_entities_intake_id ON metadata.intake_cassandra_entities(intake_id)");
            } catch (Exception e) { /* Ignore */ }
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_intake_cassandra_entities_entity_name ON metadata.intake_cassandra_entities(entity_name)");
            } catch (Exception e) { /* Ignore */ }
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_intake_api_details_intake_id ON metadata.intake_api_details(intake_id)");
            } catch (Exception e) { /* Ignore */ }
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_intake_api_details_entity_id ON metadata.intake_api_details(entity_id)");
            } catch (Exception e) { /* Ignore */ }
            
            System.out.println("Intake tables initialized successfully");
        } catch (Exception e) {
            System.err.println("Warning: Could not initialize tables: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Get all intake forms (summary list)
     */
    public java.util.List<java.util.Map<String, Object>> getAllIntakes() {
        try {
            String sql = """
                SELECT 
                    intake_id, project_name, edai_req_id, domain, business_line,
                    tech_owner_email, developer_email, components, created_at, updated_at
                FROM metadata.intake_projects
                ORDER BY created_at DESC
                """;
            
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                java.util.Map<String, Object> intake = new java.util.HashMap<>();
                intake.put("intakeId", rs.getString("intake_id"));
                intake.put("projectName", rs.getString("project_name"));
                intake.put("edaiReqId", rs.getString("edai_req_id"));
                intake.put("domain", rs.getString("domain"));
                intake.put("businessLine", rs.getString("business_line"));
                intake.put("techOwnerEmail", rs.getString("tech_owner_email"));
                intake.put("developerEmail", rs.getString("developer_email"));
                intake.put("components", rs.getString("components"));
                intake.put("createdAt", rs.getTimestamp("created_at"));
                intake.put("updatedAt", rs.getTimestamp("updated_at"));
                return intake;
            });
        } catch (Exception e) {
            // Any database error - return empty list immediately
            // Don't log to avoid spam, just return empty list
            return new java.util.ArrayList<>();
        }
    }

    /**
     * Get intake details by ID
     */
    public java.util.Map<String, Object> getIntakeById(String intakeId) {
        try {
            // Get project details
            String projectSql = """
                SELECT * FROM metadata.intake_projects WHERE intake_id = ?
                """;
            
            java.util.Map<String, Object> intake = jdbcTemplate.queryForMap(projectSql, intakeId);
            
            // Get Cassandra entities
            String entitiesSql = """
                SELECT * FROM metadata.intake_cassandra_entities WHERE intake_id = ? ORDER BY id
                """;
            
            java.util.List<java.util.Map<String, Object>> entities = jdbcTemplate.query(entitiesSql, 
                (rs, rowNum) -> {
                    java.util.Map<String, Object> entity = new java.util.HashMap<>();
                    entity.put("id", rs.getLong("id"));
                    entity.put("entityName", rs.getString("entity_name"));
                    entity.put("entityDescription", rs.getString("entity_description"));
                    entity.put("sorOfData", rs.getString("sor_of_data"));
                    entity.put("retention", rs.getString("retention"));
                    entity.put("totalRecord", rs.getLong("total_record"));
                    entity.put("recordSizeBytes", rs.getLong("record_size_bytes"));
                    entity.put("volumeGbCurrentYr", rs.getBigDecimal("volume_gb_current_yr"));
                    entity.put("volumeGb5Years", rs.getBigDecimal("volume_gb_5_years"));
                    entity.put("keyspace", rs.getString("keyspace"));
                    entity.put("csvSchema", parseJson(rs.getString("csv_schema")));
                    entity.put("fieldAttributes", parseJson(rs.getString("field_attributes")));
                    entity.put("accessPatterns", parseJson(rs.getString("access_patterns")));
                    entity.put("constraints", parseJson(rs.getString("constraints_settings")));
                    entity.put("generatedCql", rs.getString("generated_cql"));
                    entity.put("partitionKey", parseJson(rs.getString("partition_key")));
                    entity.put("clusteringKeys", parseJson(rs.getString("clustering_keys")));
                    entity.put("indexes", parseJson(rs.getString("indexes")));
                    entity.put("warnings", parseJson(rs.getString("warnings")));
                    return entity;
                }, intakeId);
            
            intake.put("cassandraEntities", entities);
            
            // Get API details
            String apiSql = """
                SELECT * FROM metadata.intake_api_details WHERE intake_id = ? ORDER BY id
                """;
            
            java.util.List<java.util.Map<String, Object>> apiDetails = jdbcTemplate.query(apiSql,
                (rs, rowNum) -> {
                    java.util.Map<String, Object> api = new java.util.HashMap<>();
                    api.put("id", rs.getLong("id"));
                    api.put("entityId", rs.getObject("entity_id"));
                    api.put("patternId", rs.getString("pattern_id"));
                    api.put("accessPattern", rs.getString("access_pattern"));
                    api.put("description", rs.getString("description"));
                    api.put("averageTPS", rs.getObject("average_tps"));
                    api.put("peakTPS", rs.getObject("peak_tps"));
                    api.put("slaInMs", rs.getObject("sla_in_ms"));
                    return api;
                }, intakeId);
            
            intake.put("apiDetails", apiDetails);
            
            return intake;
        } catch (org.springframework.jdbc.CannotGetJdbcConnectionException e) {
            System.err.println("Database connection failed in getIntakeById: " + e.getMessage());
            throw new RuntimeException("Database not available", e);
        } catch (Exception e) {
            System.err.println("Error in getIntakeById: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private Object parseJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (JsonProcessingException e) {
            return json; // Return as string if parsing fails
        }
    }
}

