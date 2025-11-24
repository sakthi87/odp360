package com.cassandra.browser.service;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class KafkaConnectionManager {
    
    private final Map<String, AdminClient> adminClients = new ConcurrentHashMap<>();
    private final Map<String, KafkaConsumer<String, String>> consumers = new ConcurrentHashMap<>();
    private final Map<String, ConnectionInfo> connections = new ConcurrentHashMap<>();
    
    public static class ConnectionInfo {
        private String clusterId;
        private String name;
        private List<String> bootstrapServers;
        private Map<String, Object> config;
        
        public ConnectionInfo(String clusterId, String name, List<String> bootstrapServers, Map<String, Object> config) {
            this.clusterId = clusterId;
            this.name = name;
            this.bootstrapServers = bootstrapServers;
            this.config = config;
        }
        
        public String getClusterId() { return clusterId; }
        public String getName() { return name; }
        public List<String> getBootstrapServers() { return bootstrapServers; }
        public Map<String, Object> getConfig() { return config; }
    }
    
    public String addConnection(String clusterId, String name, List<String> bootstrapServers, 
                             Map<String, Object> config) {
        Map<String, Object> adminConfig = new HashMap<>(config);
        adminConfig.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, String.join(",", bootstrapServers));
        adminConfig.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, 30000);
        adminConfig.put(AdminClientConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, 30000);
        
        AdminClient adminClient = AdminClient.create(adminConfig);
        adminClients.put(clusterId, adminClient);
        connections.put(clusterId, new ConnectionInfo(clusterId, name, bootstrapServers, config));
        
        return clusterId;
    }
    
    public AdminClient getAdminClient(String clusterId) {
        AdminClient client = adminClients.get(clusterId);
        if (client == null) {
            throw new IllegalArgumentException("Kafka cluster not found: " + clusterId);
        }
        return client;
    }
    
    public KafkaConsumer<String, String> getConsumer(String clusterId) {
        return consumers.computeIfAbsent(clusterId, id -> {
            ConnectionInfo info = connections.get(id);
            if (info == null) {
                throw new IllegalArgumentException("Kafka cluster not found: " + id);
            }
            
            Map<String, Object> consumerConfig = new HashMap<>(info.getConfig());
            consumerConfig.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, String.join(",", info.getBootstrapServers()));
            consumerConfig.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
            consumerConfig.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
            consumerConfig.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
            consumerConfig.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
            consumerConfig.put(ConsumerConfig.GROUP_ID_CONFIG, "kafka-browser-" + UUID.randomUUID().toString());
            
            return new KafkaConsumer<>(consumerConfig);
        });
    }
    
    public void removeConnection(String clusterId) {
        AdminClient adminClient = adminClients.remove(clusterId);
        if (adminClient != null) {
            adminClient.close();
        }
        
        KafkaConsumer<String, String> consumer = consumers.remove(clusterId);
        if (consumer != null) {
            consumer.close();
        }
        
        connections.remove(clusterId);
    }
    
    public ConnectionInfo getConnectionInfo(String clusterId) {
        return connections.get(clusterId);
    }
    
    public Collection<ConnectionInfo> getAllConnections() {
        return connections.values();
    }
}

