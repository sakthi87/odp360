package com.yugabyte.browser.controller;

import com.yugabyte.browser.model.request.ConnectionRequest;
import com.yugabyte.browser.model.response.*;
import com.yugabyte.browser.service.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ConnectionController {
    
    @Autowired
    private ConnectionTestService connectionTestService;
    
    @Autowired
    private ConnectionManager connectionManager;
    
    @Autowired
    private YSQLMetadataService metadataService;
    
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
                return ResponseEntity.ok(new ClusterResponse(
                    existingClusterId,
                    existingInfo.getName(),
                    "connected",
                    existingInfo.getDatacenter()
                ));
            }
        }
        
        String clusterId = UUID.randomUUID().toString();
        
        try {
            // Create connection
            connectionManager.createConnection(
                clusterId,
                request.getDatacenter(),
                request.getHosts(),
                request.getUsername(),
                request.getPassword(),
                request.getDatabase()
            );
            
            // Store connection info (including credentials for cross-database queries)
            connectionManager.storeConnectionInfo(clusterId, 
                new ConnectionManager.ConnectionInfo(
                    request.getName(),
                    request.getDatacenter(),
                    request.getHosts(),
                    request.getUsername() != null ? request.getUsername() : "yugabyte",
                    request.getPassword() != null ? request.getPassword() : "yugabyte"
                ));
            
            ClusterResponse response = new ClusterResponse(
                clusterId,
                request.getName(),
                "connected",
                request.getDatacenter()
            );
            
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            return ResponseEntity.badRequest()
                .body(new ClusterResponse(null, request.getName(), "error", request.getDatacenter()));
        }
    }
    
    @GetMapping("/clusters")
    public ResponseEntity<List<ClusterResponse>> getClusters() {
        List<ClusterResponse> clusters = new ArrayList<>();
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
        connectionManager.removeConnection(clusterId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/clusters/{clusterId}/databases")
    public ResponseEntity<List<DatabaseResponse>> getDatabases(@PathVariable String clusterId) {
        try {
            List<DatabaseResponse> databases = metadataService.getDatabases(clusterId);
            return ResponseEntity.ok(databases);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/clusters/{clusterId}/databases/{databaseName}/tables")
    public ResponseEntity<List<TableResponse>> getTables(
            @PathVariable String clusterId,
            @PathVariable String databaseName) {
        try {
            List<TableResponse> tables = metadataService.getTables(clusterId, databaseName);
            return ResponseEntity.ok(tables);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/clusters/{clusterId}/databases/{databaseName}/tables/{tableName}")
    public ResponseEntity<TableDetailsResponse> getTableDetails(
            @PathVariable String clusterId,
            @PathVariable String databaseName,
            @PathVariable String tableName) {
        try {
            TableDetailsResponse details = metadataService.getTableDetails(
                clusterId, databaseName, tableName);
            return ResponseEntity.ok(details);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/clusters/{clusterId}/databases/{databaseName}/tables/{tableName}/records")
    public ResponseEntity<QueryResponse> getTableRecords(
            @PathVariable String clusterId,
            @PathVariable String databaseName,
            @PathVariable String tableName,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            QueryResponse response = metadataService.getTableRecords(
                clusterId, databaseName, tableName, limit);
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            QueryResponse errorResponse = QueryResponse.error(e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}

