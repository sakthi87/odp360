package com.odp.intake.service;

import com.odp.intake.model.request.IntakeRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CQLGeneratorService {

    public String generateCreateTableStatement(IntakeRequest request) {
        if (request.getTableSchema() == null || request.getTableSchema().getFields() == null) {
            throw new IllegalArgumentException("Table schema is required");
        }

        IntakeRequest.TableSchema schema = request.getTableSchema();
        List<IntakeRequest.FieldDefinition> fields = schema.getFields();
        List<String> uniqueKeys = schema.getUniqueKeys();
        List<String> clusteringKeys = schema.getClusteringKeys();

        // Get entity name from cassandra details (first row)
        String entityName = extractEntityName(request);
        String keyspace = determineKeyspace(request);
        String tableName = sanitizeTableName(entityName);

        StringBuilder cql = new StringBuilder();
        cql.append("CREATE TABLE IF NOT EXISTS ")
           .append(keyspace).append(".").append(tableName)
           .append(" (\n");

        // Add all fields
        for (IntakeRequest.FieldDefinition field : fields) {
            String cqlType = mapToCQLType(field.getDatatype());
            cql.append("    ").append(sanitizeColumnName(field.getFieldName()))
               .append(" ").append(cqlType);
            
            if (field.getDescription() != null && !field.getDescription().isEmpty()) {
                cql.append(" COMMENT '").append(escapeString(field.getDescription())).append("'");
            }
            cql.append(",\n");
        }

        // Add standard timestamp fields if not present
        if (!hasField(fields, "created_at")) {
            cql.append("    created_at TIMESTAMP,\n");
        }
        if (!hasField(fields, "updated_at")) {
            cql.append("    updated_at TIMESTAMP,\n");
        }

        // Determine PRIMARY KEY
        String primaryKey = buildPrimaryKey(uniqueKeys, clusteringKeys, fields);
        cql.append("    PRIMARY KEY (").append(primaryKey).append(")\n");
        cql.append(")");

        // Add table options
        cql.append(" WITH ");
        
        // Description comment
        String description = extractDescription(request);
        if (description != null && !description.isEmpty()) {
            cql.append("comment = '").append(escapeString(description)).append("', ");
        }

        // Compaction strategy (default to SizeTiered)
        cql.append("compaction = {'class': 'SizeTieredCompactionStrategy'}, ");

        // GC grace seconds
        cql.append("gc_grace_seconds = 86400");

        // Add default_time_to_live if retention period specified
        String retentionPeriod = extractRetentionPeriod(request);
        if (retentionPeriod != null) {
            int ttlSeconds = parseRetentionPeriod(retentionPeriod);
            if (ttlSeconds > 0) {
                cql.append(", default_time_to_live = ").append(ttlSeconds);
            }
        }

        cql.append(";");

        return cql.toString();
    }

    private String extractEntityName(IntakeRequest request) {
        if (request.getCassandraDetails() != null && !request.getCassandraDetails().isEmpty()) {
            Map<String, Object> firstRow = request.getCassandraDetails().get(0);
            Object entityName = firstRow.get("keyspace"); // Entity Name is stored in "keyspace" field
            if (entityName != null) {
                return entityName.toString();
            }
        }
        // Fallback to project name
        if (request.getProjectDetails() != null) {
            Object projectName = request.getProjectDetails().get("projectName");
            if (projectName != null) {
                return projectName.toString();
            }
        }
        throw new IllegalArgumentException("Entity name is required");
    }

    public String determineKeyspace(IntakeRequest request) {
        // Determine keyspace from business line or sub domain
        // For POC/Dev, use a default keyspace
        if (request.getProjectDetails() != null) {
            String businessLine = (String) request.getProjectDetails().get("businessLine");
            String subDomain = (String) request.getProjectDetails().get("subDomain");
            
            if (businessLine != null && !businessLine.isEmpty()) {
                return sanitizeKeyspaceName(businessLine.toLowerCase());
            }
            if (subDomain != null && !subDomain.isEmpty()) {
                return sanitizeKeyspaceName(subDomain.toLowerCase());
            }
        }
        // Default keyspace for POC/Dev
        return "odp_poc";
    }

    private String sanitizeTableName(String name) {
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Table name cannot be empty");
        }
        // Remove special characters, replace spaces with underscores, lowercase
        return name.toLowerCase()
                   .replaceAll("[^a-z0-9_]", "_")
                   .replaceAll("_+", "_")
                   .replaceAll("^_|_$", "");
    }

    private String sanitizeKeyspaceName(String name) {
        return sanitizeTableName(name);
    }

    private String sanitizeColumnName(String name) {
        return sanitizeTableName(name);
    }

    private String mapToCQLType(String datatype) {
        if (datatype == null) {
            return "TEXT";
        }
        
        String lower = datatype.toLowerCase().trim();
        
        // Map common types to CQL types
        if (lower.contains("uuid")) return "UUID";
        if (lower.contains("int")) return "INT";
        if (lower.contains("bigint") || lower.contains("long")) return "BIGINT";
        if (lower.contains("double") || lower.contains("float")) return "DOUBLE";
        if (lower.contains("boolean") || lower.contains("bool")) return "BOOLEAN";
        if (lower.contains("timestamp") || lower.contains("date")) return "TIMESTAMP";
        if (lower.contains("decimal") || lower.contains("numeric")) return "DECIMAL";
        if (lower.contains("blob") || lower.contains("binary")) return "BLOB";
        
        // Default to TEXT
        return "TEXT";
    }

    private String buildPrimaryKey(List<String> uniqueKeys, List<String> clusteringKeys, 
                                   List<IntakeRequest.FieldDefinition> fields) {
        if (uniqueKeys == null || uniqueKeys.isEmpty()) {
            // Default: use first field or id
            String defaultKey = "id";
            if (!fields.isEmpty()) {
                defaultKey = sanitizeColumnName(fields.get(0).getFieldName());
            }
            return defaultKey;
        }

        // Partition key (first unique key)
        String partitionKey = sanitizeColumnName(uniqueKeys.get(0));
        
        // Clustering keys (remaining unique keys + specified clustering keys)
        List<String> allClusteringKeys = uniqueKeys.stream()
            .skip(1)
            .map(this::sanitizeColumnName)
            .collect(Collectors.toList());
        
        if (clusteringKeys != null && !clusteringKeys.isEmpty()) {
            for (String ck : clusteringKeys) {
                // Parse order (DESC/ASC)
                String[] parts = ck.trim().split("\\s+");
                String column = sanitizeColumnName(parts[0]);
                String order = parts.length > 1 && parts[1].toUpperCase().equals("DESC") 
                    ? "DESC" : "ASC";
                allClusteringKeys.add(column + " " + order);
            }
        }

        if (allClusteringKeys.isEmpty()) {
            return partitionKey;
        } else {
            return "(" + partitionKey + "), " + String.join(", ", allClusteringKeys);
        }
    }

    private boolean hasField(List<IntakeRequest.FieldDefinition> fields, String fieldName) {
        return fields.stream()
            .anyMatch(f -> f.getFieldName().equalsIgnoreCase(fieldName));
    }

    private String extractDescription(IntakeRequest request) {
        if (request.getCassandraDetails() != null && !request.getCassandraDetails().isEmpty()) {
            Map<String, Object> firstRow = request.getCassandraDetails().get(0);
            Object desc = firstRow.get("tableName"); // Description is stored in "tableName" field
            if (desc != null) {
                return desc.toString();
            }
        }
        return null;
    }

    private String extractRetentionPeriod(IntakeRequest request) {
        if (request.getCassandraDetails() != null && !request.getCassandraDetails().isEmpty()) {
            Map<String, Object> firstRow = request.getCassandraDetails().get(0);
            Object retention = firstRow.get("retentionPeriod");
            if (retention != null) {
                return retention.toString();
            }
        }
        return null;
    }

    private int parseRetentionPeriod(String retention) {
        // Parse retention period like "30 days", "1 year", etc.
        if (retention == null || retention.isEmpty()) {
            return 0;
        }
        
        String lower = retention.toLowerCase().trim();
        try {
            if (lower.contains("day")) {
                int days = Integer.parseInt(lower.replaceAll("[^0-9]", ""));
                return days * 86400; // Convert to seconds
            } else if (lower.contains("month")) {
                int months = Integer.parseInt(lower.replaceAll("[^0-9]", ""));
                return months * 30 * 86400; // Approximate
            } else if (lower.contains("year")) {
                int years = Integer.parseInt(lower.replaceAll("[^0-9]", ""));
                return years * 365 * 86400; // Approximate
            }
        } catch (NumberFormatException e) {
            // Return 0 if can't parse
        }
        return 0;
    }

    private String escapeString(String str) {
        if (str == null) return "";
        return str.replace("'", "''").replace("\\", "\\\\");
    }
}

