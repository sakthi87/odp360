package com.odp.intake.controller;

import com.odp.intake.model.request.IntakeRequest;
import com.odp.intake.model.response.IntakeResponse;
import com.odp.intake.service.IntakeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/intake")
@CrossOrigin(origins = "*")
public class IntakeController {

    @Autowired
    private IntakeService intakeService;

    @PostMapping("/submit")
    public ResponseEntity<IntakeResponse> submitIntake(
            @RequestBody IntakeRequest request,
            @RequestParam(required = false, defaultValue = "default") String clusterId) {
        
        try {
            IntakeResponse response = intakeService.processIntake(request, clusterId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            IntakeResponse errorResponse = new IntakeResponse();
            errorResponse.setStatus("FAILED");
            errorResponse.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}

