package com.odp.intake.controller;

import com.odp.intake.repository.IntakeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/intake")
@CrossOrigin(origins = "*")
public class IntakeListController {

    @Autowired
    private IntakeRepository intakeRepository;

    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> getAllIntakes() {
        try {
            List<Map<String, Object>> intakes = intakeRepository.getAllIntakes();
            return ResponseEntity.ok(intakes);
        } catch (Exception e) {
            // Any error (including database connection issues) - return empty list
            // This prevents the frontend from hanging
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
    }

    @GetMapping("/{intakeId}")
    public ResponseEntity<Map<String, Object>> getIntakeById(@PathVariable String intakeId) {
        try {
            Map<String, Object> intake = intakeRepository.getIntakeById(intakeId);
            if (intake == null || intake.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(intake);
        } catch (org.springframework.jdbc.CannotGetJdbcConnectionException e) {
            // Database not available
            System.err.println("Database connection failed: " + e.getMessage());
            return ResponseEntity.status(503).build();
        } catch (Exception e) {
            System.err.println("Error fetching intake details: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}

