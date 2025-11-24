package com.yugabyte.browser.service;

import com.yugabyte.browser.model.request.ConnectionRequest;
import com.yugabyte.browser.model.response.ConnectionTestResponse;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

@Service
public class ConnectionTestService {
    
    static {
        try {
            try {
                Class.forName("com.yugabyte.Driver");
            } catch (ClassNotFoundException e) {
                Class.forName("org.postgresql.Driver");
            }
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Failed to load database driver", e);
        }
    }
    
    public ConnectionTestResponse testConnection(ConnectionRequest request) {
        Connection connection = null;
        try {
            // Build connection URL using PostgreSQL JDBC format (YugabyteDB is PostgreSQL-compatible)
            String host = request.getHosts().get(0);
            if (!host.contains(":")) {
                host += ":5433";
            }
            
            StringBuilder urlBuilder = new StringBuilder();
            urlBuilder.append("jdbc:postgresql://");
            urlBuilder.append(host);
            
            // Add database (default to yugabyte if not specified)
            String database = request.getDatabase();
            if (database == null || database.isEmpty()) {
                database = "yugabyte";
            }
            urlBuilder.append("/").append(database);
            
            // Add connection parameters
            urlBuilder.append("?");
            urlBuilder.append("connectTimeout=30");
            urlBuilder.append("&socketTimeout=30");
            urlBuilder.append("&ssl=false"); // Disable SSL for local testing
            
            String url = urlBuilder.toString();
            
            Properties props = new Properties();
            if (request.getUsername() != null && !request.getUsername().isEmpty()) {
                props.setProperty("user", request.getUsername());
            }
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                props.setProperty("password", request.getPassword());
            }
            props.setProperty("socketTimeout", "30");
            props.setProperty("loginTimeout", "30");
            
            connection = DriverManager.getConnection(url, props);
            
            // Test query to verify connection
            try (Statement stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT version()")) {
                if (rs.next()) {
                    String version = rs.getString(1);
                    return new ConnectionTestResponse(true, "Connection successful", version);
                }
            }
            
            return new ConnectionTestResponse(true, "Connection successful", "YugabyteDB Cluster");
            
        } catch (java.sql.SQLException e) {
            String errorMsg = e.getMessage();
            String errorClass = e.getClass().getSimpleName();
            Throwable cause = e.getCause();
            String fullError = errorMsg != null ? errorMsg : errorClass;
            if (cause != null) {
                fullError += " (Cause: " + cause.getMessage() + ")";
            }
            
            if (errorMsg != null) {
                if (errorMsg.contains("Connection refused") || errorMsg.contains("connect") || errorMsg.contains("connection attempt failed")) {
                    return new ConnectionTestResponse(false,
                        "Connection failed: Cannot connect to YugabyteDB. Please check:\n" +
                        "- YugabyteDB is running on the specified host:port\n" +
                        "- Firewall allows connections on port 5433\n" +
                        "- Error: " + fullError, null);
                }
                if (errorMsg.contains("password") || errorMsg.contains("authentication")) {
                    return new ConnectionTestResponse(false,
                        "Connection failed: Authentication failed. Please check:\n" +
                        "- Username and password are correct\n" +
                        "- Error: " + errorMsg, null);
                }
                if (errorMsg.contains("database") || errorMsg.contains("does not exist")) {
                    return new ConnectionTestResponse(false,
                        "Connection failed: Database does not exist. Please check:\n" +
                        "- Database name is correct\n" +
                        "- Error: " + errorMsg, null);
                }
            }
            
            return new ConnectionTestResponse(false,
                "Connection failed: " + (errorMsg != null ? errorMsg : errorClass), null);
        } catch (Exception e) {
            return new ConnectionTestResponse(false,
                "Connection failed: " + e.getMessage(), null);
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (Exception e) {
                    // Ignore close errors
                }
            }
        }
    }
}

