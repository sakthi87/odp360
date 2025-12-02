package com.odp.intake.controller;

import com.odp.intake.model.modeler.ModelingRequest;
import com.odp.intake.model.modeler.ModelingResponse;
import com.odp.intake.service.CassandraModelerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modeler")
@CrossOrigin(origins = "*")
public class ModelingController {

    @Autowired
    private CassandraModelerService modelerService;

    @PostMapping("/generate")
    public ResponseEntity<ModelingResponse> generateModel(@RequestBody ModelingRequest request) {
        ModelingResponse response = modelerService.generateModels(request);
        return ResponseEntity.ok(response);
    }
}

