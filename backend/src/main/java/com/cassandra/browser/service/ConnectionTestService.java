package com.cassandra.browser.service;

import com.cassandra.browser.model.request.ConnectionRequest;
import com.cassandra.browser.model.response.ConnectionTestResponse;
import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.CqlSessionBuilder;
import com.datastax.oss.driver.api.core.config.DriverConfigLoader;
import com.datastax.oss.driver.api.core.config.ProgrammaticDriverConfigLoaderBuilder;
import com.datastax.oss.driver.api.core.config.DefaultDriverOption;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.time.Duration;

@Service
public class ConnectionTestService {
    
    public ConnectionTestResponse testConnection(ConnectionRequest request) {
        CqlSession session = null;
        try {
            // Build driver configuration with increased timeouts
            ProgrammaticDriverConfigLoaderBuilder configBuilder = DriverConfigLoader.programmaticBuilder();
            
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
            
            // Note: Consistency level uses default (ONE) - no need to set explicitly
            
            CqlSessionBuilder builder = CqlSession.builder()
                    .withLocalDatacenter(request.getDatacenter())
                    .withConfigLoader(configBuilder.build());
            
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
            
            // Don't set keyspace during connection test - it can cause token map errors
            // Only set it after successful connection if needed
            
            session = builder.build();
            
            // Try to execute a simple query to verify connection
            session.execute("SELECT cluster_name FROM system.local");
            
            // Get cluster name
            String clusterName = session.getMetadata().getClusterName().orElse("Unknown Cluster");
            
            return new ConnectionTestResponse(true, "Connection successful", clusterName);
            
        } catch (com.datastax.oss.driver.api.core.AllNodesFailedException e) {
            return new ConnectionTestResponse(false, 
                "Connection failed: No node available to connect. Please check:\n" +
                "- Host and port are correct\n" +
                "- Cassandra is running and accessible\n" +
                "- Network/firewall allows connection\n" +
                "- Datacenter name is correct", null);
        } catch (com.datastax.oss.driver.api.core.DriverTimeoutException e) {
            return new ConnectionTestResponse(false, 
                "Connection failed: Connection timeout. Please check:\n" +
                "- Network connectivity to Cassandra\n" +
                "- Cassandra is responding", null);
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            String errorClass = e.getClass().getSimpleName();
            
            // Handle specific error types
            if (errorMsg != null) {
                if (errorMsg.contains("token map") || errorMsg.contains("PT2S")) {
                    return new ConnectionTestResponse(false, 
                        "Connection failed: Error computing token map. Please check:\n" +
                        "- Datacenter name is correct: '" + request.getDatacenter() + "'\n" +
                        "- Network connectivity to all nodes\n" +
                        "- Original error: " + errorMsg, null);
                }
                if (errorMsg.contains("Unknown host") || errorClass.contains("UnknownHost")) {
                    return new ConnectionTestResponse(false, 
                        "Connection failed: Unknown host. Please check the hostname/IP address is correct.", null);
                }
                if (errorMsg.contains("Connection refused") || errorMsg.contains("Cannot connect")) {
                    return new ConnectionTestResponse(false, 
                        "Connection failed: Cannot connect to Cassandra. Please check:\n" +
                        "- Cassandra is running on the specified host:port\n" +
                        "- Firewall allows connections on port 9042", null);
                }
            }
            
            return new ConnectionTestResponse(false, 
                "Connection failed: " + (errorMsg != null ? errorMsg : e.getClass().getSimpleName()), null);
        } finally {
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    // Ignore close errors
                }
            }
        }
    }
}

