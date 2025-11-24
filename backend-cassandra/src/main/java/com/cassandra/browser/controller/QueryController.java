package com.cassandra.browser.controller;

import com.cassandra.browser.model.request.QueryRequest;
import com.cassandra.browser.model.response.QueryResponse;
import com.cassandra.browser.service.CassandraQueryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // CORS handled by CorsConfig, this is fallback
public class QueryController {
    
    @Autowired
    private CassandraQueryService queryService;
    
    @PostMapping("/clusters/{clusterId}/keyspaces/{keyspaceName}/execute")
    public ResponseEntity<QueryResponse> executeQuery(
            @PathVariable String clusterId,
            @PathVariable String keyspaceName,
            @Valid @RequestBody QueryRequest request) {
        
        QueryResponse response = queryService.executeQuery(
            clusterId, keyspaceName, request.getQuery());
        
        if (response.getError() != null) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }
}

