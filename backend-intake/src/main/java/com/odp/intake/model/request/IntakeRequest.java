package com.odp.intake.model.request;

import java.util.List;
import java.util.Map;

public class IntakeRequest {
    private Map<String, Object> projectDetails;
    private List<Map<String, Object>> cassandraDetails;
    private List<Map<String, Object>> apiDetails;
    private TableSchema tableSchema; // Legacy - for single table
    private List<Map<String, Object>> tableSchemas; // New - for multiple tables per row

    public Map<String, Object> getProjectDetails() {
        return projectDetails;
    }

    public void setProjectDetails(Map<String, Object> projectDetails) {
        this.projectDetails = projectDetails;
    }

    public List<Map<String, Object>> getCassandraDetails() {
        return cassandraDetails;
    }

    public void setCassandraDetails(List<Map<String, Object>> cassandraDetails) {
        this.cassandraDetails = cassandraDetails;
    }

    public List<Map<String, Object>> getApiDetails() {
        return apiDetails;
    }

    public void setApiDetails(List<Map<String, Object>> apiDetails) {
        this.apiDetails = apiDetails;
    }

    public TableSchema getTableSchema() {
        return tableSchema;
    }

    public void setTableSchema(TableSchema tableSchema) {
        this.tableSchema = tableSchema;
    }

    public List<Map<String, Object>> getTableSchemas() {
        return tableSchemas;
    }

    public void setTableSchemas(List<Map<String, Object>> tableSchemas) {
        this.tableSchemas = tableSchemas;
    }

    public static class TableSchema {
        private List<FieldDefinition> fields;
        private List<String> uniqueKeys;
        private List<String> clusteringKeys;
        private String accessPatterns;

        public List<FieldDefinition> getFields() {
            return fields;
        }

        public void setFields(List<FieldDefinition> fields) {
            this.fields = fields;
        }

        public List<String> getUniqueKeys() {
            return uniqueKeys;
        }

        public void setUniqueKeys(List<String> uniqueKeys) {
            this.uniqueKeys = uniqueKeys;
        }

        public List<String> getClusteringKeys() {
            return clusteringKeys;
        }

        public void setClusteringKeys(List<String> clusteringKeys) {
            this.clusteringKeys = clusteringKeys;
        }

        public String getAccessPatterns() {
            return accessPatterns;
        }

        public void setAccessPatterns(String accessPatterns) {
            this.accessPatterns = accessPatterns;
        }
    }

    public static class FieldDefinition {
        private String fieldName;
        private String description;
        private String datatype;

        public String getFieldName() {
            return fieldName;
        }

        public void setFieldName(String fieldName) {
            this.fieldName = fieldName;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getDatatype() {
            return datatype;
        }

        public void setDatatype(String datatype) {
            this.datatype = datatype;
        }
    }
}

