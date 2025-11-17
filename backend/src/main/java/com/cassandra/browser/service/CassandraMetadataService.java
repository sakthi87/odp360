package com.cassandra.browser.service;

import com.cassandra.browser.model.response.*;
import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.cql.ResultSet;
import com.datastax.oss.driver.api.core.cql.Row;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CassandraMetadataService {
    
    @Autowired
    private ConnectionManager connectionManager;
    
    public List<KeyspaceResponse> getKeyspaces(String clusterId) {
        CqlSession session = connectionManager.getSession(clusterId);
        
        ResultSet resultSet = session.execute(
            "SELECT keyspace_name, replication FROM system_schema.keyspaces"
        );
        
        List<KeyspaceResponse> keyspaces = new ArrayList<>();
        for (Row row : resultSet) {
            String name = row.getString("keyspace_name");
            
            // Filter out system keyspaces for cleaner UI
            // Note: Cassandra already enforces permissions - regular users won't see system keyspaces anyway
            // This filter is mainly for admin users who might not want to see system keyspaces
            if (name.startsWith("system_") || name.equals("system")) {
                continue;
            }
            
            Map<String, String> replication = row.getMap("replication", String.class, String.class);
            keyspaces.add(new KeyspaceResponse(name, replication));
        }
        
        return keyspaces;
    }
    
    public List<TableResponse> getTables(String clusterId, String keyspaceName) {
        CqlSession session = connectionManager.getSession(clusterId);
        
        ResultSet resultSet = session.execute(
            "SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?",
            keyspaceName
        );
        
        List<TableResponse> tables = new ArrayList<>();
        for (Row row : resultSet) {
            String name = row.getString("table_name");
            tables.add(new TableResponse(name));
        }
        
        return tables;
    }
    
    public TableDetailsResponse getTableDetails(String clusterId, String keyspaceName, String tableName) {
        CqlSession session = connectionManager.getSession(clusterId);
        
        // Get columns
        ResultSet columnsResult = session.execute(
            "SELECT column_name, type, kind, position " +
            "FROM system_schema.columns " +
            "WHERE keyspace_name = ? AND table_name = ?",
            keyspaceName, tableName
        );
        
        List<TableDetailsResponse.ColumnInfo> columns = new ArrayList<>();
        for (Row row : columnsResult) {
            columns.add(new TableDetailsResponse.ColumnInfo(
                row.getString("column_name"),
                row.getString("type"),
                row.getString("kind"),
                row.getInt("position")
            ));
        }
        
        // Sort columns: Partition Key -> Clustering Key -> Regular columns
        // Within each group, sort alphabetically by name (ascending)
        columns.sort((c1, c2) -> {
            String kind1 = c1.getKind() != null ? c1.getKind().toUpperCase() : "";
            String kind2 = c2.getKind() != null ? c2.getKind().toUpperCase() : "";
            
            // Determine sort order: PARTITION_KEY (1) -> CLUSTERING (2) -> others (3)
            int order1 = kind1.equals("PARTITION_KEY") ? 1 : (kind1.equals("CLUSTERING") ? 2 : 3);
            int order2 = kind2.equals("PARTITION_KEY") ? 1 : (kind2.equals("CLUSTERING") ? 2 : 3);
            
            // First sort by kind order (PK first, then CK, then others)
            if (order1 != order2) {
                return Integer.compare(order1, order2);
            }
            
            // Within same group, sort alphabetically by name (ascending)
            return c1.getName().compareToIgnoreCase(c2.getName());
        });
        
        // Get CQL secondary indexes
        List<TableDetailsResponse.IndexInfo> indexes = new ArrayList<>();
        
        try {
            ResultSet indexesResult = session.execute(
                "SELECT index_name, kind, options " +
                "FROM system_schema.indexes " +
                "WHERE keyspace_name = ? AND table_name = ?",
                keyspaceName, tableName
            );
            
            for (Row row : indexesResult) {
                String indexName = row.getString("index_name");
                String kind = row.getString("kind");
                Map<String, String> options = row.getMap("options", String.class, String.class);
                
                // Extract column name from index options or index name
                String column = extractColumnFromIndex(indexName, options);
                String optionsStr = options != null ? options.toString() : "";
                
                indexes.add(new TableDetailsResponse.IndexInfo(
                    indexName,
                    column,
                    kind,
                    "CQL",
                    optionsStr
                ));
            }
        } catch (Exception e) {
            // If query fails (e.g., permissions), continue without CQL indexes
            System.err.println("Error fetching CQL indexes: " + e.getMessage());
        }
        
        // Get Solr/Search indexes from DSE Search (if available)
        try {
            // Check if dse_search keyspace exists (DSE Search is enabled)
            ResultSet dseSearchCheck = session.execute(
                "SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'dse_search'"
            );
            
            if (dseSearchCheck.iterator().hasNext()) {
                // Query Solr resources to find indexes for this table
                // In DSE 5.1, Solr cores are typically named: keyspace_table_name
                String solrCoreName = keyspaceName + "_" + tableName;
                
                try {
                    ResultSet solrResources = session.execute(
                        "SELECT core_name, resource_name, config_name " +
                        "FROM dse_search.solr_resources " +
                        "WHERE core_name = ?",
                        solrCoreName
                    );
                    
                    for (Row row : solrResources) {
                        String coreName = row.getString("core_name");
                        String resourceName = row.getString("resource_name");
                        String configName = row.getString("config_name");
                        
                        indexes.add(new TableDetailsResponse.IndexInfo(
                            coreName,
                            "N/A",  // Solr indexes don't map to a single column
                            "SOLR",
                            "SOLR",
                            String.format("resource=%s, config=%s", resourceName, configName)
                        ));
                    }
                } catch (Exception e) {
                    // Try alternative query - some DSE versions use different table structure
                    try {
                        // Alternative: Query all solr_resources and filter
                        ResultSet allSolrResources = session.execute(
                            "SELECT core_name, resource_name, config_name FROM dse_search.solr_resources"
                        );
                        
                        for (Row row : allSolrResources) {
                            String coreName = row.getString("core_name");
                            // Match by pattern: keyspace_table or keyspace_table_name
                            if (coreName.startsWith(keyspaceName + "_" + tableName) || 
                                coreName.equals(keyspaceName + "_" + tableName)) {
                                String resourceName = row.getString("resource_name");
                                String configName = row.getString("config_name");
                                
                                indexes.add(new TableDetailsResponse.IndexInfo(
                                    coreName,
                                    "N/A",
                                    "SOLR",
                                    "SOLR",
                                    String.format("resource=%s, config=%s", resourceName, configName)
                                ));
                            }
                        }
                    } catch (Exception e2) {
                        System.err.println("Error fetching Solr indexes: " + e2.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            // If dse_search doesn't exist or query fails, continue without Solr indexes
            System.err.println("DSE Search not available or error: " + e.getMessage());
        }
        
        return new TableDetailsResponse(tableName, keyspaceName, columns, indexes);
    }
    
    public QueryResponse getTableRecords(String clusterId, String keyspaceName, 
                                        String tableName, int limit) {
        CqlSession session = connectionManager.getSession(clusterId);
        
        String query = String.format("SELECT * FROM %s.%s LIMIT %d", 
                                     keyspaceName, tableName, limit);
        
        return executeQuery(session, query);
    }
    
    private QueryResponse executeQuery(CqlSession session, String query) {
        long startTime = System.currentTimeMillis();
        
        ResultSet resultSet = session.execute(query);
        
        List<String> columns = new ArrayList<>();
        if (resultSet.getColumnDefinitions() != null) {
            for (int i = 0; i < resultSet.getColumnDefinitions().size(); i++) {
                columns.add(resultSet.getColumnDefinitions().get(i).getName().asCql(true));
            }
        }
        
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Row row : resultSet) {
            Map<String, Object> rowData = new HashMap<>();
            for (int i = 0; i < columns.size(); i++) {
                String columnName = columns.get(i);
                Object value = row.getObject(i);
                rowData.put(columnName, value != null ? value.toString() : null);
            }
            rows.add(rowData);
        }
        
        long executionTime = System.currentTimeMillis() - startTime;
        
        return new QueryResponse(columns, rows, rows.size(), executionTime, null);
    }
    
    private String extractColumnFromIndex(String indexName, Map<String, String> options) {
        // Try to extract column name from index options
        if (options != null) {
            // CQL indexes typically have 'target' option with column name
            String target = options.get("target");
            if (target != null && !target.isEmpty()) {
                // Target format is usually: column_name or (column_name)
                target = target.replace("(", "").replace(")", "");
                return target;
            }
        }
        
        // Fallback: try to extract from index name
        // Common patterns: idx_columnname, columnname_idx, etc.
        if (indexName.startsWith("idx_")) {
            return indexName.substring(4);
        }
        if (indexName.endsWith("_idx")) {
            return indexName.substring(0, indexName.length() - 4);
        }
        
        return indexName;
    }
}

