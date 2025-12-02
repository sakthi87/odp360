package com.odp.intake.service;

import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.CqlSessionBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConnectionManager {
    private final Map<String, CqlSession> sessions = new ConcurrentHashMap<>();
    
    @Value("${cassandra.default.hosts:localhost:9042}")
    private String defaultHosts;
    
    @Value("${cassandra.default.datacenter:datacenter1}")
    private String defaultDatacenter;
    
    public CqlSession getSession(String clusterId) {
        // For now, use default connection for POC/Dev
        return sessions.computeIfAbsent(clusterId, k -> createDefaultSession());
    }
    
    private CqlSession createDefaultSession() {
        String[] hostParts = defaultHosts.split(":");
        String hostname = hostParts[0];
        int port = hostParts.length > 1 ? Integer.parseInt(hostParts[1]) : 9042;
        
        CqlSessionBuilder builder = CqlSession.builder()
                .addContactPoint(new InetSocketAddress(hostname, port))
                .withLocalDatacenter(defaultDatacenter);
        
        return builder.build();
    }
    
    public void removeSession(String clusterId) {
        CqlSession session = sessions.remove(clusterId);
        if (session != null) {
            session.close();
        }
    }
}

