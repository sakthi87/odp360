package com.odp.datacatalog.service;

import com.odp.datacatalog.model.response.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DataCatalogService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public List<EnvironmentResponse> getEnvironments() {
        try {
            String sql = "SELECT id, name, display_name, description, is_default FROM metadata.environments ORDER BY is_default DESC, name";
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                EnvironmentResponse env = new EnvironmentResponse();
                env.setId(rs.getLong("id"));
                env.setName(rs.getString("name"));
                env.setDisplayName(rs.getString("display_name"));
                env.setDescription(rs.getString("description"));
                env.setIsDefault(rs.getBoolean("is_default"));
                return env;
            });
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
    
    public List<ComponentResponse> searchComponents(String searchTerm, Long environmentId, String componentType) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT c.id, c.component_type, c.component_subtype, c.environment_id, ");
        sql.append("e.name as environment_name, c.name, c.fully_qualified_name, c.display_name, ");
        sql.append("c.description, c.car_id, c.business_line, c.product_line, c.system_of_origin_code, ");
        sql.append("c.cassandra_table_id, c.data_api_id, c.kafka_topic_id, c.spark_job_id ");
        sql.append("FROM metadata.components c ");
        sql.append("JOIN metadata.environments e ON c.environment_id = e.id ");
        sql.append("WHERE 1=1 ");
        
        List<Object> params = new ArrayList<>();
        
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            // Use ILIKE for case-insensitive search (more reliable than tsquery)
            sql.append("AND (c.name ILIKE ? OR c.description ILIKE ? OR c.fully_qualified_name ILIKE ?) ");
            String searchPattern = "%" + searchTerm + "%";
            params.add(searchPattern);
            params.add(searchPattern);
            params.add(searchPattern);
        }
        
        if (environmentId != null) {
            sql.append("AND c.environment_id = ? ");
            params.add(environmentId);
        }
        
        if (componentType != null && !componentType.trim().isEmpty()) {
            sql.append("AND c.component_type = ? ");
            params.add(componentType);
        }
        
        sql.append("ORDER BY c.component_type, c.name LIMIT 100");
        
        return jdbcTemplate.query(sql.toString(), params.toArray(), new ComponentRowMapper());
    }
    
    public ComponentDetailsResponse getComponentDetails(Long componentId) {
        // Get component
        String componentSql = "SELECT c.id, c.component_type, c.component_subtype, c.environment_id, " +
                "e.name as environment_name, c.name, c.fully_qualified_name, c.display_name, " +
                "c.description, c.car_id, c.business_line, c.product_line, c.system_of_origin_code, " +
                "c.cassandra_table_id, c.data_api_id, c.kafka_topic_id, c.spark_job_id " +
                "FROM metadata.components c " +
                "JOIN metadata.environments e ON c.environment_id = e.id " +
                "WHERE c.id = ?";
        
        ComponentResponse component = jdbcTemplate.queryForObject(componentSql, 
                new Object[]{componentId}, new ComponentRowMapper());
        
        // Get schema based on component type
        Map<String, Object> schema = getComponentSchema(component);
        
        // Get lineage
        List<LineageRelationshipResponse> upstream = getUpstreamLineage(componentId);
        List<LineageRelationshipResponse> downstream = getDownstreamLineage(componentId);
        
        return new ComponentDetailsResponse(component, schema, upstream, downstream, new HashMap<>());
    }
    
    private Map<String, Object> getComponentSchema(ComponentResponse component) {
        Map<String, Object> schema = new HashMap<>();
        
        if ("cassandra_table".equals(component.getComponentType()) && component.getCassandraTableId() != null) {
            // Get table schema
            String sql = "SELECT ct.table_name, ct.keyspace_name, ct.business_line, ct.product_line, " +
                    "ct.estimated_storage_volume, ct.actual_storage_volume, ct.estimated_tps, ct.actual_tps " +
                    "FROM metadata.cassandra_tables ct WHERE ct.id = ?";
            
            Map<String, Object> tableInfo = jdbcTemplate.queryForMap(sql, component.getCassandraTableId());
            
            // Get columns
            String columnsSql = "SELECT column_name, element_data_type, field_order, info_classification, is_pci " +
                    "FROM metadata.cassandra_columns WHERE table_id = ? ORDER BY field_order";
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(columnsSql, component.getCassandraTableId());
            
            schema.put("table", tableInfo);
            schema.put("columns", columns);
        } else if ("data_api".equals(component.getComponentType()) && component.getDataApiId() != null) {
            // Get API details
            String sql = "SELECT api_name, endpoint_path, api_description, status_text, " +
                    "data_owner_car_name, owner_1_tech_name, domain, subdomain " +
                    "FROM metadata.data_apis WHERE id = ?";
            Map<String, Object> apiInfo = jdbcTemplate.queryForMap(sql, component.getDataApiId());
            schema.put("api", apiInfo);
        } else if ("kafka_topic".equals(component.getComponentType()) && component.getKafkaTopicId() != null) {
            // Get Kafka topic details
            String sql = "SELECT topic_name, partition_count, replication_factor, schema_registry_url " +
                    "FROM metadata.kafka_topics WHERE id = ?";
            Map<String, Object> topicInfo = jdbcTemplate.queryForMap(sql, component.getKafkaTopicId());
            schema.put("topic", topicInfo);
        } else if ("spark_job".equals(component.getComponentType()) && component.getSparkJobId() != null) {
            // Get Spark job details
            String sql = "SELECT job_name, job_type, description, spark_cluster_name, status_text " +
                    "FROM metadata.spark_jobs WHERE id = ?";
            Map<String, Object> jobInfo = jdbcTemplate.queryForMap(sql, component.getSparkJobId());
            schema.put("job", jobInfo);
        }
        
        return schema;
    }
    
    private List<LineageRelationshipResponse> getUpstreamLineage(Long componentId) {
        String sql = "SELECT lr.id, lr.relationship_type, lr.operation_type, lr.description, " +
                "sc.id as source_id, sc.name as source_name, sc.component_type as source_type, " +
                "sc.display_name as source_display_name, " +
                "tc.id as target_id, tc.name as target_name, tc.component_type as target_type, " +
                "tc.display_name as target_display_name " +
                "FROM metadata.lineage_relationships lr " +
                "JOIN metadata.components sc ON lr.source_component_id = sc.id " +
                "JOIN metadata.components tc ON lr.target_component_id = tc.id " +
                "WHERE tc.id = ? " +
                "ORDER BY lr.relationship_type";
        
        return jdbcTemplate.query(sql, new Object[]{componentId}, (rs, rowNum) -> {
            LineageRelationshipResponse lineage = new LineageRelationshipResponse();
            lineage.setId(rs.getLong("id"));
            lineage.setRelationshipType(rs.getString("relationship_type"));
            lineage.setOperationType(rs.getString("operation_type"));
            lineage.setDescription(rs.getString("description"));
            
            ComponentResponse source = new ComponentResponse();
            source.setId(rs.getLong("source_id"));
            source.setName(rs.getString("source_name"));
            source.setComponentType(rs.getString("source_type"));
            source.setDisplayName(rs.getString("source_display_name"));
            lineage.setSource(source);
            
            ComponentResponse target = new ComponentResponse();
            target.setId(rs.getLong("target_id"));
            target.setName(rs.getString("target_name"));
            target.setComponentType(rs.getString("target_type"));
            target.setDisplayName(rs.getString("target_display_name"));
            lineage.setTarget(target);
            
            return lineage;
        });
    }
    
    private List<LineageRelationshipResponse> getDownstreamLineage(Long componentId) {
        String sql = "SELECT lr.id, lr.relationship_type, lr.operation_type, lr.description, " +
                "sc.id as source_id, sc.name as source_name, sc.component_type as source_type, " +
                "sc.display_name as source_display_name, " +
                "tc.id as target_id, tc.name as target_name, tc.component_type as target_type, " +
                "tc.display_name as target_display_name " +
                "FROM metadata.lineage_relationships lr " +
                "JOIN metadata.components sc ON lr.source_component_id = sc.id " +
                "JOIN metadata.components tc ON lr.target_component_id = tc.id " +
                "WHERE sc.id = ? " +
                "ORDER BY lr.relationship_type";
        
        return jdbcTemplate.query(sql, new Object[]{componentId}, (rs, rowNum) -> {
            LineageRelationshipResponse lineage = new LineageRelationshipResponse();
            lineage.setId(rs.getLong("id"));
            lineage.setRelationshipType(rs.getString("relationship_type"));
            lineage.setOperationType(rs.getString("operation_type"));
            lineage.setDescription(rs.getString("description"));
            
            ComponentResponse source = new ComponentResponse();
            source.setId(rs.getLong("source_id"));
            source.setName(rs.getString("source_name"));
            source.setComponentType(rs.getString("source_type"));
            source.setDisplayName(rs.getString("source_display_name"));
            lineage.setSource(source);
            
            ComponentResponse target = new ComponentResponse();
            target.setId(rs.getLong("target_id"));
            target.setName(rs.getString("target_name"));
            target.setComponentType(rs.getString("target_type"));
            target.setDisplayName(rs.getString("target_display_name"));
            lineage.setTarget(target);
            
            return lineage;
        });
    }
    
    private static class ComponentRowMapper implements RowMapper<ComponentResponse> {
        @Override
        public ComponentResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            ComponentResponse component = new ComponentResponse();
            component.setId(rs.getLong("id"));
            component.setComponentType(rs.getString("component_type"));
            component.setComponentSubtype(rs.getString("component_subtype"));
            component.setEnvironmentId(rs.getLong("environment_id"));
            component.setEnvironmentName(rs.getString("environment_name"));
            component.setName(rs.getString("name"));
            component.setFullyQualifiedName(rs.getString("fully_qualified_name"));
            component.setDisplayName(rs.getString("display_name"));
            component.setDescription(rs.getString("description"));
            component.setCarId(rs.getString("car_id"));
            component.setBusinessLine(rs.getString("business_line"));
            component.setProductLine(rs.getString("product_line"));
            component.setSystemOfOriginCode(rs.getString("system_of_origin_code"));
            
            Long cassandraTableId = rs.getLong("cassandra_table_id");
            component.setCassandraTableId(rs.wasNull() ? null : cassandraTableId);
            
            Long dataApiId = rs.getLong("data_api_id");
            component.setDataApiId(rs.wasNull() ? null : dataApiId);
            
            Long kafkaTopicId = rs.getLong("kafka_topic_id");
            component.setKafkaTopicId(rs.wasNull() ? null : kafkaTopicId);
            
            Long sparkJobId = rs.getLong("spark_job_id");
            component.setSparkJobId(rs.wasNull() ? null : sparkJobId);
            
            return component;
        }
    }
}

