package com.cassandra.browser.controller;

import com.cassandra.browser.model.request.ConnectionRequest;
import com.cassandra.browser.model.response.*;
import com.cassandra.browser.service.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ConnectionController {
    
    @Autowired
    private ConnectionTestService connectionTestService;
    
    @Autowired
    private ConnectionManager connectionManager;
    
    @Autowired
    private CassandraMetadataService metadataService;
    
    @PostMapping("/clusters/test-connection")
    public ResponseEntity<ConnectionTestResponse> testConnection(
            @Valid @RequestBody ConnectionRequest request) {
        
        ConnectionTestResponse response = connectionTestService.testConnection(request);
        
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/clusters")
    public ResponseEntity<ClusterResponse> addConnection(
            @Valid @RequestBody ConnectionRequest request) {
        
        // Check if connection with same name and hosts already exists
        java.util.Set<String> existingClusterIds = connectionManager.getAllClusterIds();
        for (String existingClusterId : existingClusterIds) {
            ConnectionManager.ConnectionInfo existingInfo = connectionManager.getConnectionInfo(existingClusterId);
            if (existingInfo != null && 
                existingInfo.getName().equals(request.getName()) &&
                existingInfo.getHosts().equals(request.getHosts())) {
                // Return existing connection instead of creating duplicate
                return ResponseEntity.ok(new ClusterResponse(
                    existingClusterId,
                    existingInfo.getName(),
                    "connected",
                    existingInfo.getDatacenter()
                ));
            }
        }
        
        String clusterId = UUID.randomUUID().toString();
        
        // Create session
        connectionManager.createSession(
            clusterId,
            request.getDatacenter(),
            request.getHosts(),
            request.getUsername(),
            request.getPassword(),
            request.getKeyspace()
        );
        
        // Store connection info
        connectionManager.storeConnectionInfo(clusterId, 
            new ConnectionManager.ConnectionInfo(
                request.getName(),
                request.getDatacenter(),
                request.getHosts()
            ));
        
        ClusterResponse response = new ClusterResponse(
            clusterId,
            request.getName(),
            "connected",
            request.getDatacenter()
        );
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/clusters")
    public ResponseEntity<List<ClusterResponse>> getClusters() {
        // Return list of connected clusters
        List<ClusterResponse> clusters = new ArrayList<>();
        // Get all connection info from ConnectionManager
        // Note: This is a simplified implementation
        // In production, you'd store connections in a database
        java.util.Set<String> clusterIds = connectionManager.getAllClusterIds();
        for (String clusterId : clusterIds) {
            ConnectionManager.ConnectionInfo info = connectionManager.getConnectionInfo(clusterId);
            if (info != null) {
                clusters.add(new ClusterResponse(
                    clusterId,
                    info.getName(),
                    "connected",
                    info.getDatacenter()
                ));
            }
        }
        return ResponseEntity.ok(clusters);
    }
    
    @DeleteMapping("/clusters/{clusterId}")
    public ResponseEntity<Void> removeConnection(@PathVariable String clusterId) {
        connectionManager.removeSession(clusterId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/clusters/{clusterId}/keyspaces")
    public ResponseEntity<List<KeyspaceResponse>> getKeyspaces(@PathVariable String clusterId) {
        List<KeyspaceResponse> keyspaces = metadataService.getKeyspaces(clusterId);
        return ResponseEntity.ok(keyspaces);
    }
    
    @GetMapping("/clusters/{clusterId}/keyspaces/{keyspaceName}/tables")
    public ResponseEntity<List<TableResponse>> getTables(
            @PathVariable String clusterId,
            @PathVariable String keyspaceName) {
        List<TableResponse> tables = metadataService.getTables(clusterId, keyspaceName);
        return ResponseEntity.ok(tables);
    }
    
    @GetMapping("/clusters/{clusterId}/keyspaces/{keyspaceName}/tables/{tableName}")
    public ResponseEntity<TableDetailsResponse> getTableDetails(
            @PathVariable String clusterId,
            @PathVariable String keyspaceName,
            @PathVariable String tableName) {
        TableDetailsResponse details = metadataService.getTableDetails(
            clusterId, keyspaceName, tableName);
        return ResponseEntity.ok(details);
    }
    
    @GetMapping("/clusters/{clusterId}/keyspaces/{keyspaceName}/tables/{tableName}/records")
    public ResponseEntity<QueryResponse> getTableRecords(
            @PathVariable String clusterId,
            @PathVariable String keyspaceName,
            @PathVariable String tableName,
            @RequestParam(defaultValue = "10") int limit) {
        QueryResponse response = metadataService.getTableRecords(
            clusterId, keyspaceName, tableName, limit);
        return ResponseEntity.ok(response);
    }
}

