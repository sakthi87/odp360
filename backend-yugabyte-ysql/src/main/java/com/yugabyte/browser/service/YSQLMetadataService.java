package com.yugabyte.browser.service;

import com.yugabyte.browser.model.response.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class YSQLMetadataService {
    
    @Autowired
    private ConnectionManager connectionManager;
    
    public List<DatabaseResponse> getDatabases(String clusterId) throws SQLException {
        Connection connection = connectionManager.getConnection(clusterId);
        
        // Query PostgreSQL system catalog for databases
        String query = "SELECT datname, pg_get_userbyid(datdba) as owner " +
                       "FROM pg_database " +
                       "WHERE datistemplate = false " +
                       "AND datname NOT IN ('postgres', 'template0', 'template1', 'system_platform') " +
                       "ORDER BY datname";
        
        List<DatabaseResponse> databases = new ArrayList<>();
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                databases.add(new DatabaseResponse(
                    rs.getString("datname"),
                    rs.getString("owner")
                ));
            }
        }
        
        return databases;
    }
    
    public List<TableResponse> getTables(String clusterId, String databaseName) throws SQLException {
        Connection connection = connectionManager.getConnection(clusterId);
        
        // In PostgreSQL/YugabyteDB, connections are database-specific
        // We need to create a temporary connection to the target database
        // Get connection info to create a new connection to the target database
        ConnectionManager.ConnectionInfo info = connectionManager.getConnectionInfo(clusterId);
        if (info == null) {
            throw new SQLException("Connection info not found for cluster: " + clusterId);
        }
        
        // Create a temporary connection to the target database
        Connection targetConnection = connectionManager.createConnection(
            clusterId + "_temp_" + databaseName,
            info.getDatacenter(),
            info.getHosts(),
            info.getUsername(),
            info.getPassword(),
            databaseName
        );
        
        try {
            String query = "SELECT tablename " +
                           "FROM pg_tables " +
                           "WHERE schemaname = 'public' " +
                           "ORDER BY tablename";
            
            List<TableResponse> tables = new ArrayList<>();
            try (Statement stmt = targetConnection.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {
                while (rs.next()) {
                    tables.add(new TableResponse(rs.getString("tablename")));
                }
            }
            
            return tables;
        } finally {
            // Close the temporary connection
            try {
                targetConnection.close();
            } catch (SQLException e) {
                // Ignore close errors
            }
            // Remove from connection manager
            connectionManager.removeConnection(clusterId + "_temp_" + databaseName);
        }
    }
    
    public TableDetailsResponse getTableDetails(String clusterId, String databaseName, String tableName) throws SQLException {
        // Get connection info to create a new connection to the target database
        ConnectionManager.ConnectionInfo info = connectionManager.getConnectionInfo(clusterId);
        if (info == null) {
            throw new SQLException("Connection info not found for cluster: " + clusterId);
        }
        
        // Create a temporary connection to the target database
        Connection targetConnection = connectionManager.createConnection(
            clusterId + "_temp_details_" + databaseName,
            info.getDatacenter(),
            info.getHosts(),
            info.getUsername(),
            info.getPassword(),
            databaseName
        );
        
        try {
            // Get columns - use proper schema qualification
            String columnsQuery = "SELECT " +
                                 "  a.attname AS column_name, " +
                                 "  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type, " +
                                 "  a.attnotnull AS is_not_null, " +
                                 "  a.atthasdef AS has_default, " +
                                 "  pg_get_expr(ad.adbin, ad.adrelid) AS default_value, " +
                                 "  a.attnum AS position " +
                                 "FROM pg_attribute a " +
                                 "LEFT JOIN pg_attrdef ad ON (a.attrelid = ad.adrelid AND a.attnum = ad.adnum) " +
                                 "WHERE a.attrelid = 'public." + tableName + "'::regclass " +
                                 "  AND a.attnum > 0 " +
                                 "  AND NOT a.attisdropped " +
                                 "ORDER BY a.attnum";
            
            List<TableDetailsResponse.ColumnInfo> columns = new ArrayList<>();
            try (Statement stmt = targetConnection.createStatement();
                 ResultSet rs = stmt.executeQuery(columnsQuery)) {
                while (rs.next()) {
                    columns.add(new TableDetailsResponse.ColumnInfo(
                        rs.getString("column_name"),
                        rs.getString("data_type"),
                        !rs.getBoolean("is_not_null"), // isNullable
                        rs.getString("default_value"),
                        rs.getInt("position")
                    ));
                }
            }
            
            // Get indexes
            String indexesQuery = "SELECT " +
                                  "  i.relname AS index_name, " +
                                  "  a.attname AS column_name, " +
                                  "  am.amname AS index_type, " +
                                  "  idx.indisunique AS is_unique, " +
                                  "  pg_get_indexdef(i.oid) AS index_definition " +
                                  "FROM pg_class t " +
                                  "JOIN pg_index idx ON t.oid = idx.indrelid " +
                                  "JOIN pg_class i ON i.oid = idx.indexrelid " +
                                  "JOIN pg_am am ON i.relam = am.oid " +
                                  "LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey) " +
                                  "WHERE t.relname = '" + tableName + "' " +
                                  "  AND t.relkind = 'r' " +
                                  "ORDER BY i.relname, a.attnum";
            
            Map<String, TableDetailsResponse.IndexInfo> indexMap = new HashMap<>();
            try (Statement stmt = targetConnection.createStatement();
                 ResultSet rs = stmt.executeQuery(indexesQuery)) {
                while (rs.next()) {
                    String indexName = rs.getString("index_name");
                    String columnName = rs.getString("column_name");
                    
                    if (!indexMap.containsKey(indexName)) {
                        indexMap.put(indexName, new TableDetailsResponse.IndexInfo(
                            indexName,
                            columnName != null ? columnName : "",
                            rs.getString("index_type"),
                            rs.getBoolean("is_unique"),
                            rs.getString("index_definition")
                        ));
                    } else {
                        // Append column name if multiple columns
                        TableDetailsResponse.IndexInfo existing = indexMap.get(indexName);
                        if (columnName != null && !existing.getColumns().contains(columnName)) {
                            existing.setColumns(existing.getColumns() + ", " + columnName);
                        }
                    }
                }
            }
            
            List<TableDetailsResponse.IndexInfo> indexes = new ArrayList<>(indexMap.values());
            
            return new TableDetailsResponse(tableName, databaseName, columns, indexes);
        } finally {
            // Close the temporary connection
            try {
                targetConnection.close();
            } catch (SQLException e) {
                // Ignore close errors
            }
            // Remove from connection manager
            connectionManager.removeConnection(clusterId + "_temp_details_" + databaseName);
        }
    }
    
    public QueryResponse getTableRecords(String clusterId, String databaseName,
                                        String tableName, int limit) throws SQLException {
        // Get connection info to create a new connection to the target database
        ConnectionManager.ConnectionInfo info = connectionManager.getConnectionInfo(clusterId);
        if (info == null) {
            throw new SQLException("Connection info not found for cluster: " + clusterId);
        }
        
        // Create a temporary connection to the target database
        Connection targetConnection = connectionManager.createConnection(
            clusterId + "_temp_records_" + databaseName,
            info.getDatacenter(),
            info.getHosts(),
            info.getUsername(),
            info.getPassword(),
            databaseName
        );
        
        try {
            // Use schema-qualified table name
            String query = String.format("SELECT * FROM public.%s LIMIT %d", tableName, limit);
            return executeQuery(targetConnection, query);
        } finally {
            // Close the temporary connection
            try {
                targetConnection.close();
            } catch (SQLException e) {
                // Ignore close errors
            }
            // Remove from connection manager
            connectionManager.removeConnection(clusterId + "_temp_records_" + databaseName);
        }
    }
    
    private QueryResponse executeQuery(Connection connection, String query) throws SQLException {
        long startTime = System.currentTimeMillis();
        
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            
            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();
            
            // Extract columns
            List<String> columns = new ArrayList<>();
            for (int i = 1; i <= columnCount; i++) {
                columns.add(metaData.getColumnName(i));
            }
            
            // Extract rows
            List<Map<String, Object>> rows = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> rowData = new HashMap<>();
                for (String column : columns) {
                    Object value = rs.getObject(column);
                    rowData.put(column, value != null ? value.toString() : null);
                }
                rows.add(rowData);
            }
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            return new QueryResponse(columns, rows, rows.size(), executionTime, null);
        }
    }
}

