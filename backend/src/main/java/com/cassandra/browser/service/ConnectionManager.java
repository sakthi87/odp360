package com.cassandra.browser.service;

import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.CqlSessionBuilder;
import com.datastax.oss.driver.api.core.config.DriverConfigLoader;
import com.datastax.oss.driver.api.core.config.DefaultDriverOption;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConnectionManager {
    private final Map<String, CqlSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, ConnectionInfo> connectionInfo = new ConcurrentHashMap<>();
    
    public CqlSession createSession(String clusterId, String datacenter, 
                                   java.util.List<String> hosts, 
                                   String username, String password,
                                   String keyspace) {
        // Build driver configuration with increased timeouts
        com.datastax.oss.driver.api.core.config.ProgrammaticDriverConfigLoaderBuilder configBuilder = 
            DriverConfigLoader.programmaticBuilder();
        
        // Connection timeout (how long to wait to establish connection)
        configBuilder.withDuration(DefaultDriverOption.CONNECTION_CONNECT_TIMEOUT, Duration.ofSeconds(30));
        
        // Request timeout (how long to wait for a response)
        configBuilder.withDuration(DefaultDriverOption.REQUEST_TIMEOUT, Duration.ofSeconds(60));
        
        // Control connection timeout (for control connection used for metadata)
        configBuilder.withDuration(DefaultDriverOption.CONTROL_CONNECTION_TIMEOUT, Duration.ofSeconds(30));
        
        // Schema metadata refresh timeouts - CRITICAL for PT2S error
        // PT2S means 2 seconds - we increase to 30 seconds
        configBuilder.withDuration(DefaultDriverOption.METADATA_SCHEMA_REQUEST_TIMEOUT, Duration.ofSeconds(30));
        configBuilder.withDuration(DefaultDriverOption.METADATA_SCHEMA_WINDOW, Duration.ofSeconds(30));
        
        // Topology metadata refresh timeout
        configBuilder.withDuration(DefaultDriverOption.METADATA_TOPOLOGY_WINDOW, Duration.ofSeconds(30));
        
        // Enable schema metadata but with longer timeouts
        configBuilder.withBoolean(DefaultDriverOption.METADATA_SCHEMA_ENABLED, true);
        
        // Connection pool settings
        configBuilder.withInt(DefaultDriverOption.CONNECTION_POOL_LOCAL_SIZE, 1);
        configBuilder.withInt(DefaultDriverOption.CONNECTION_POOL_REMOTE_SIZE, 1);
        
        CqlSessionBuilder builder = CqlSession.builder()
                .withLocalDatacenter(datacenter)
                .withConfigLoader(configBuilder.build());
        
        // Add contact points
        for (String host : hosts) {
            String[] parts = host.split(":");
            String hostname = parts[0];
            int port = parts.length > 1 ? Integer.parseInt(parts[1]) : 9042;
            builder.addContactPoint(new InetSocketAddress(hostname, port));
        }
        
        // Add authentication if provided
        if (username != null && !username.isEmpty() && 
            password != null && !password.isEmpty()) {
            builder.withAuthCredentials(username, password);
        }
        
        // Set keyspace if provided (but only after connection is established)
        if (keyspace != null && !keyspace.isEmpty()) {
            builder.withKeyspace(keyspace);
        }
        
        CqlSession session = builder.build();
        sessions.put(clusterId, session);
        
        return session;
    }
    
    public CqlSession getSession(String clusterId) {
        CqlSession session = sessions.get(clusterId);
        if (session == null) {
            throw new IllegalArgumentException("Cluster not found: " + clusterId);
        }
        return session;
    }
    
    public void removeSession(String clusterId) {
        CqlSession session = sessions.remove(clusterId);
        if (session != null) {
            session.close();
        }
        connectionInfo.remove(clusterId);
    }
    
    public void storeConnectionInfo(String clusterId, ConnectionInfo info) {
        connectionInfo.put(clusterId, info);
    }
    
    public ConnectionInfo getConnectionInfo(String clusterId) {
        return connectionInfo.get(clusterId);
    }
    
    public boolean hasSession(String clusterId) {
        return sessions.containsKey(clusterId);
    }
    
    public java.util.Set<String> getAllClusterIds() {
        return sessions.keySet();
    }
    
    public static class ConnectionInfo {
        private String name;
        private String datacenter;
        private java.util.List<String> hosts;
        
        public ConnectionInfo(String name, String datacenter, java.util.List<String> hosts) {
            this.name = name;
            this.datacenter = datacenter;
            this.hosts = hosts;
        }
        
        public String getName() { return name; }
        public String getDatacenter() { return datacenter; }
        public java.util.List<String> getHosts() { return hosts; }
    }
}

