package com.cassandra.browser.service;

import com.cassandra.browser.model.response.QueryResponse;
import com.cassandra.browser.util.QueryValidator;
import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.cql.ResultSet;
import com.datastax.oss.driver.api.core.cql.Row;
import com.datastax.oss.driver.api.core.cql.SimpleStatement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CassandraQueryService {
    
    @Autowired
    private ConnectionManager connectionManager;
    
    @Autowired
    private QueryValidator queryValidator;
    
    public QueryResponse executeQuery(String clusterId, String keyspaceName, String query) {
        // Validate query
        queryValidator.validateQuery(query);
        
        CqlSession session = connectionManager.getSession(clusterId);
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Build statement with timeout and keyspace
            SimpleStatement statement = SimpleStatement.newInstance(query)
                    .setKeyspace(com.datastax.oss.driver.api.core.CqlIdentifier.fromCql(keyspaceName))
                    .setTimeout(Duration.ofSeconds(30))
                    .setPageSize(queryValidator.getMaxResultSize());
            
            ResultSet resultSet = session.execute(statement);
            
            // Extract columns
            List<String> columns = new ArrayList<>();
            if (resultSet.getColumnDefinitions() != null) {
                for (int i = 0; i < resultSet.getColumnDefinitions().size(); i++) {
                    columns.add(resultSet.getColumnDefinitions().get(i).getName().asCql(true));
                }
            }
            
            // Extract rows (limit to max result size)
            List<Map<String, Object>> rows = new ArrayList<>();
            int count = 0;
            for (Row row : resultSet) {
                if (count >= queryValidator.getMaxResultSize()) {
                    break;
                }
                
                Map<String, Object> rowData = new HashMap<>();
                for (int i = 0; i < columns.size(); i++) {
                    String columnName = columns.get(i);
                    Object value = row.getObject(i);
                    // Convert value to string representation
                    if (value != null) {
                        if (value instanceof java.util.List) {
                            rowData.put(columnName, value.toString());
                        } else if (value instanceof java.util.Map) {
                            rowData.put(columnName, value.toString());
                        } else {
                            rowData.put(columnName, value.toString());
                        }
                    } else {
                        rowData.put(columnName, null);
                    }
                }
                rows.add(rowData);
                count++;
            }
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            return new QueryResponse(columns, rows, rows.size(), executionTime, null);
            
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            QueryResponse response = new QueryResponse();
            response.setError(e.getMessage());
            response.setExecutionTime(executionTime);
            return response;
        }
    }
}

