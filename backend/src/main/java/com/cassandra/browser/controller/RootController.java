package com.cassandra.browser.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {
    
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cassandra Browser API");
        response.put("version", "1.0.0");
        response.put("status", "running");
        response.put("endpoints", Map.of(
            "clusters", "/api/clusters",
            "test-connection", "/api/clusters/test-connection",
            "health", "/api/clusters"
        ));
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        return ResponseEntity.ok(response);
    }
}

