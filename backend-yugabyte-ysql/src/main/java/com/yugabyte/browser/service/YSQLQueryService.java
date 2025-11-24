package com.yugabyte.browser.service;

import com.yugabyte.browser.model.response.QueryResponse;
import com.yugabyte.browser.util.QueryValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class YSQLQueryService {
    
    @Autowired
    private ConnectionManager connectionManager;
    
    @Autowired
    private QueryValidator queryValidator;
    
    public QueryResponse executeQuery(String clusterId, String databaseName, String query) {
        // Validate query
        queryValidator.validateQuery(query);
        
        Connection connection = null;
        long startTime = System.currentTimeMillis();
        
        try {
            connection = connectionManager.getConnection(clusterId);
            
            // Note: In PostgreSQL/YugabyteDB, connections are database-specific
            // The connection is already established to the correct database
            // We can set search_path if needed, but typically queries are schema-qualified
            
            // Execute query with timeout
            try (Statement stmt = connection.createStatement()) {
                stmt.setQueryTimeout(30);
                stmt.setMaxRows(queryValidator.getMaxResultSize());
                
                try (ResultSet rs = stmt.executeQuery(query)) {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int columnCount = metaData.getColumnCount();
                    
                    // Extract columns
                    List<String> columns = new ArrayList<>();
                    for (int i = 1; i <= columnCount; i++) {
                        columns.add(metaData.getColumnName(i));
                    }
                    
                    // Extract rows (limit to max result size)
                    List<Map<String, Object>> rows = new ArrayList<>();
                    int count = 0;
                    while (rs.next() && count < queryValidator.getMaxResultSize()) {
                        Map<String, Object> rowData = new HashMap<>();
                        for (String column : columns) {
                            Object value = rs.getObject(column);
                            // Convert value to string representation
                            if (value != null) {
                                if (value instanceof byte[]) {
                                    rowData.put(column, "0x" + bytesToHex((byte[]) value));
                                } else {
                                    rowData.put(column, value.toString());
                                }
                            } else {
                                rowData.put(column, null);
                            }
                        }
                        rows.add(rowData);
                        count++;
                    }
                    
                    long executionTime = System.currentTimeMillis() - startTime;
                    
                    return new QueryResponse(columns, rows, rows.size(), executionTime, null);
                }
            }
            
        } catch (SQLException e) {
            long executionTime = System.currentTimeMillis() - startTime;
            QueryResponse response = new QueryResponse();
            response.setError(e.getMessage());
            response.setExecutionTime(executionTime);
            return response;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            QueryResponse response = new QueryResponse();
            response.setError(e.getMessage());
            response.setExecutionTime(executionTime);
            return response;
        }
    }
    
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}

