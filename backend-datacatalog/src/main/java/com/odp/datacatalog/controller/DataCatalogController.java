package com.odp.datacatalog.controller;

import com.odp.datacatalog.model.response.*;
import com.odp.datacatalog.service.DataCatalogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DataCatalogController {
    
    @Autowired
    private DataCatalogService dataCatalogService;
    
    @GetMapping("/environments")
    public ResponseEntity<List<EnvironmentResponse>> getEnvironments() {
        try {
            List<EnvironmentResponse> environments = dataCatalogService.getEnvironments();
            return ResponseEntity.ok(environments);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/components/search")
    public ResponseEntity<List<ComponentResponse>> searchComponents(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long environmentId,
            @RequestParam(required = false) String componentType) {
        try {
            List<ComponentResponse> components = dataCatalogService.searchComponents(q, environmentId, componentType);
            return ResponseEntity.ok(components);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/components/{id}")
    public ResponseEntity<ComponentDetailsResponse> getComponentDetails(@PathVariable Long id) {
        try {
            ComponentDetailsResponse details = dataCatalogService.getComponentDetails(id);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/components/{id}/lineage")
    public ResponseEntity<Map<String, List<LineageRelationshipResponse>>> getComponentLineage(@PathVariable Long id) {
        try {
            ComponentDetailsResponse details = dataCatalogService.getComponentDetails(id);
            Map<String, List<LineageRelationshipResponse>> lineage = new java.util.HashMap<>();
            lineage.put("upstream", details.getUpstreamLineage());
            lineage.put("downstream", details.getDownstreamLineage());
            return ResponseEntity.ok(lineage);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
}

