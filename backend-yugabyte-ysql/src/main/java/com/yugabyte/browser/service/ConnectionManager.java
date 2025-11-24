package com.yugabyte.browser.service;

import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Properties;

@Service
public class ConnectionManager {
    private final Map<String, Connection> connections = new ConcurrentHashMap<>();
    private final Map<String, ConnectionInfo> connectionInfo = new ConcurrentHashMap<>();
    
    static {
        try {
            // Try to load Yugabyte JDBC driver first
            try {
                Class.forName("com.yugabyte.Driver");
            } catch (ClassNotFoundException e) {
                // Fallback to PostgreSQL driver (compatible with YugabyteDB)
                Class.forName("org.postgresql.Driver");
            }
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Failed to load database driver", e);
        }
    }
    
    public Connection createConnection(String clusterId, String datacenter,
                                      java.util.List<String> hosts,
                                      String username, String password,
                                      String database) throws SQLException {
        // Build connection URL using PostgreSQL JDBC format (YugabyteDB is PostgreSQL-compatible)
        // For single host, use: jdbc:postgresql://host:port/database
        // For multiple hosts, use first host (PostgreSQL JDBC doesn't support multiple hosts in URL)
        String host = hosts.get(0);
        if (!host.contains(":")) {
            host += ":5433"; // Default YSQL port
        }
        
        StringBuilder urlBuilder = new StringBuilder();
        urlBuilder.append("jdbc:postgresql://");
        urlBuilder.append(host);
        
        // Add database name (default to yugabyte if not specified)
        String dbName = database;
        if (dbName == null || dbName.isEmpty()) {
            dbName = "yugabyte";
        }
        urlBuilder.append("/").append(dbName);
        
        // Add connection parameters
        urlBuilder.append("?");
        urlBuilder.append("connectTimeout=30");
        urlBuilder.append("&socketTimeout=30");
        urlBuilder.append("&ssl=false"); // Disable SSL for local testing
        
        String url = urlBuilder.toString();
        
        Properties props = new Properties();
        if (username != null && !username.isEmpty()) {
            props.setProperty("user", username);
        }
        if (password != null && !password.isEmpty()) {
            props.setProperty("password", password);
        }
        
        // Additional connection properties
        props.setProperty("socketTimeout", "30");
        props.setProperty("loginTimeout", "30");
        
        Connection connection = DriverManager.getConnection(url, props);
        connections.put(clusterId, connection);
        
        return connection;
    }
    
    public Connection getConnection(String clusterId) throws SQLException {
        Connection connection = connections.get(clusterId);
        if (connection == null) {
            throw new IllegalArgumentException("Cluster not found: " + clusterId);
        }
        if (connection.isClosed()) {
            throw new SQLException("Connection is closed for cluster: " + clusterId);
        }
        return connection;
    }
    
    public void removeConnection(String clusterId) {
        Connection connection = connections.remove(clusterId);
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                // Log error but continue
                System.err.println("Error closing connection: " + e.getMessage());
            }
        }
        connectionInfo.remove(clusterId);
    }
    
    public void storeConnectionInfo(String clusterId, ConnectionInfo info) {
        connectionInfo.put(clusterId, info);
    }
    
    public ConnectionInfo getConnectionInfo(String clusterId) {
        return connectionInfo.get(clusterId);
    }
    
    public boolean hasConnection(String clusterId) {
        Connection connection = connections.get(clusterId);
        return connection != null;
    }
    
    public java.util.Set<String> getAllClusterIds() {
        return connections.keySet();
    }
    
    public static class ConnectionInfo {
        private String name;
        private String datacenter;
        private java.util.List<String> hosts;
        private String username;
        private String password;
        
        public ConnectionInfo(String name, String datacenter, java.util.List<String> hosts, String username, String password) {
            this.name = name;
            this.datacenter = datacenter;
            this.hosts = hosts;
            this.username = username;
            this.password = password;
        }
        
        public String getName() { return name; }
        public String getDatacenter() { return datacenter; }
        public java.util.List<String> getHosts() { return hosts; }
        public String getUsername() { return username; }
        public String getPassword() { return password; }
    }
}

