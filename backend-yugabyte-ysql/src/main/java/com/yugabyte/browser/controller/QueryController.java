package com.yugabyte.browser.controller;

import com.yugabyte.browser.model.request.QueryRequest;
import com.yugabyte.browser.model.response.QueryResponse;
import com.yugabyte.browser.service.YSQLQueryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class QueryController {
    
    @Autowired
    private YSQLQueryService queryService;
    
    @PostMapping("/clusters/{clusterId}/databases/{databaseName}/execute")
    public ResponseEntity<QueryResponse> executeQuery(
            @PathVariable String clusterId,
            @PathVariable String databaseName,
            @Valid @RequestBody QueryRequest request) {
        
        QueryResponse response = queryService.executeQuery(
            clusterId, databaseName, request.getQuery());
        
        if (response.getError() != null) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }
}

