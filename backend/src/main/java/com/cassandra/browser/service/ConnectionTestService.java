package com.cassandra.browser.service;

import com.cassandra.browser.model.request.ConnectionRequest;
import com.cassandra.browser.model.response.ConnectionTestResponse;
import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.CqlSessionBuilder;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;

@Service
public class ConnectionTestService {
    
    public ConnectionTestResponse testConnection(ConnectionRequest request) {
        CqlSession session = null;
        try {
            CqlSessionBuilder builder = CqlSession.builder()
                    .withLocalDatacenter(request.getDatacenter());
            
            // Add contact points
            for (String host : request.getHosts()) {
                String[] parts = host.split(":");
                String hostname = parts[0];
                int port = parts.length > 1 ? Integer.parseInt(parts[1]) : 9042;
                builder.addContactPoint(new InetSocketAddress(hostname, port));
            }
            
            // Add authentication if provided
            if (request.getUsername() != null && !request.getUsername().isEmpty() &&
                request.getPassword() != null && !request.getPassword().isEmpty()) {
                builder.withAuthCredentials(request.getUsername(), request.getPassword());
            }
            
            // Set keyspace if provided
            if (request.getKeyspace() != null && !request.getKeyspace().isEmpty()) {
                builder.withKeyspace(request.getKeyspace());
            }
            
            session = builder.build();
            
            // Try to execute a simple query to verify connection
            session.execute("SELECT cluster_name FROM system.local");
            
            // Get cluster name
            String clusterName = session.getMetadata().getClusterName().orElse("Unknown Cluster");
            
            return new ConnectionTestResponse(true, "Connection successful", clusterName);
            
        } catch (Exception e) {
            return new ConnectionTestResponse(false, 
                "Connection failed: " + e.getMessage(), null);
        } finally {
            if (session != null) {
                session.close();
            }
        }
    }
}

