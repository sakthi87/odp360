package com.cassandra.browser.controller;

import com.cassandra.browser.model.request.KafkaConnectionRequest;
import com.cassandra.browser.model.request.KafkaConsumeRequest;
import com.cassandra.browser.model.response.KafkaClusterResponse;
import com.cassandra.browser.model.response.KafkaMessageResponse;
import com.cassandra.browser.model.response.KafkaTopicResponse;
import com.cassandra.browser.service.KafkaConnectionManager;
import com.cassandra.browser.service.KafkaMetadataService;
import com.cassandra.browser.service.KafkaMessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/kafka")
@CrossOrigin(origins = "*")
public class KafkaController {
    
    @Autowired
    private KafkaConnectionManager connectionManager;
    
    @Autowired
    private KafkaMetadataService metadataService;
    
    @Autowired
    private KafkaMessageService messageService;
    
    @PostMapping("/clusters/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection(@Valid @RequestBody KafkaConnectionRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> config = buildKafkaConfig(request);
            org.apache.kafka.clients.admin.AdminClient testClient = org.apache.kafka.clients.admin.AdminClient.create(config);
            testClient.listTopics().names().get();
            testClient.close();
            
            response.put("success", true);
            response.put("message", "Connection successful");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Connection failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/clusters")
    public ResponseEntity<KafkaClusterResponse> addConnection(@Valid @RequestBody KafkaConnectionRequest request) {
        String clusterId = UUID.randomUUID().toString();
        Map<String, Object> config = buildKafkaConfig(request);
        
        connectionManager.addConnection(
                clusterId,
                request.getName(),
                request.getBootstrapServers(),
                config
        );
        
        KafkaClusterResponse response = new KafkaClusterResponse(
                clusterId,
                request.getName(),
                String.join(",", request.getBootstrapServers()),
                "CONNECTED"
        );
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/clusters")
    public ResponseEntity<List<KafkaClusterResponse>> getClusters() {
        List<KafkaClusterResponse> clusters = connectionManager.getAllConnections().stream()
                .map(info -> new KafkaClusterResponse(
                        info.getClusterId(),
                        info.getName(),
                        String.join(",", info.getBootstrapServers()),
                        "CONNECTED"
                ))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(clusters);
    }
    
    @DeleteMapping("/clusters/{clusterId}")
    public ResponseEntity<Void> removeConnection(@PathVariable String clusterId) {
        connectionManager.removeConnection(clusterId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/clusters/{clusterId}/topics")
    public ResponseEntity<List<String>> listTopics(@PathVariable String clusterId) {
        try {
            List<String> topics = metadataService.listTopics(clusterId);
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/clusters/{clusterId}/topics/{topicName}")
    public ResponseEntity<KafkaTopicResponse> getTopicDetails(
            @PathVariable String clusterId,
            @PathVariable String topicName) {
        try {
            KafkaTopicResponse details = metadataService.getTopicDetails(clusterId, topicName);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/clusters/{clusterId}/topics/{topicName}/consume")
    public ResponseEntity<List<KafkaMessageResponse>> consumeMessages(
            @PathVariable String clusterId,
            @PathVariable String topicName,
            @Valid @RequestBody KafkaConsumeRequest request) {
        try {
            request.setTopic(topicName);
            List<KafkaMessageResponse> messages = messageService.consumeMessages(clusterId, request);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    private Map<String, Object> buildKafkaConfig(KafkaConnectionRequest request) {
        Map<String, Object> config = new HashMap<>();
        config.put(org.apache.kafka.clients.admin.AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, 
                String.join(",", request.getBootstrapServers()));
        
        String securityProtocol = request.getSecurityProtocol() != null ? 
                request.getSecurityProtocol() : "PLAINTEXT";
        config.put("security.protocol", securityProtocol);
        
        if (securityProtocol.contains("SASL") && request.getUsername() != null) {
            config.put("sasl.mechanism", request.getSaslMechanism() != null ? 
                    request.getSaslMechanism() : "PLAIN");
            
            if ("PLAIN".equals(request.getSaslMechanism())) {
                String saslConfig = String.format(
                        "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"%s\" password=\"%s\";",
                        request.getUsername(),
                        request.getPassword() != null ? request.getPassword() : ""
                );
                config.put("sasl.jaas.config", saslConfig);
            }
        }
        
        if (securityProtocol.contains("SSL")) {
            if (request.getTruststoreLocation() != null) {
                config.put("ssl.truststore.location", request.getTruststoreLocation());
                if (request.getTruststorePassword() != null) {
                    config.put("ssl.truststore.password", request.getTruststorePassword());
                }
            }
            if (request.getKeystoreLocation() != null) {
                config.put("ssl.keystore.location", request.getKeystoreLocation());
                if (request.getKeystorePassword() != null) {
                    config.put("ssl.keystore.password", request.getKeystorePassword());
                }
            }
        }
        
        return config;
    }
}

