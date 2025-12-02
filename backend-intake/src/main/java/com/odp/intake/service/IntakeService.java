package com.odp.intake.service;

import com.odp.intake.model.request.IntakeRequest;
import com.odp.intake.model.response.IntakeResponse;
import com.odp.intake.repository.IntakeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class IntakeService {

    @Autowired
    private IntakeRepository intakeRepository;

    @Transactional
    public IntakeResponse processIntake(IntakeRequest request, String clusterId) {
        // Generate intake ID
        String intakeId = generateIntakeId(request);

        try {
            // Validate request
            if (request.getProjectDetails() == null) {
                throw new IllegalArgumentException("Project details are required");
            }

            // Save project details
            intakeRepository.saveProjectDetails(intakeId, request.getProjectDetails());

            // Process Cassandra entities
            List<Map<String, Object>> cassandraDetails = request.getCassandraDetails();
            List<String> savedEntities = new ArrayList<>();
            Map<String, Long> entityIdMap = new HashMap<>(); // Map entity.id (string) to database entity_id (long)

            if (cassandraDetails != null && !cassandraDetails.isEmpty()) {
                for (Map<String, Object> entity : cassandraDetails) {
                    String entityName = getString(entity, "entityName");
                    if (entityName == null || entityName.isEmpty()) {
                        continue; // Skip entities without names
                    }

                    // Extract modeling results if available (from frontend state)
                    Map<String, Object> modelingResult = extractModelingResult(entity);

                    // Save Cassandra entity
                    Long entityId = intakeRepository.saveCassandraEntity(intakeId, entity, modelingResult);
                    savedEntities.add(entityName);
                    
                    // Map frontend entity ID to database entity ID
                    String frontendEntityId = getString(entity, "id");
                    if (frontendEntityId != null) {
                        entityIdMap.put(frontendEntityId, entityId);
                    }
                }
            }

            // Save API details - link to entities based on entityId
            if (request.getApiDetails() != null) {
                for (Map<String, Object> apiDetail : request.getApiDetails()) {
                    String entityIdFromApi = getString(apiDetail, "entityId");
                    Long dbEntityId = null;
                    
                    if (entityIdFromApi != null && entityIdMap.containsKey(entityIdFromApi)) {
                        // Link to specific entity
                        dbEntityId = entityIdMap.get(entityIdFromApi);
                    }
                    // If entityIdFromApi is null, it's a manual entry - save with null entity_id
                    
                    intakeRepository.saveApiDetails(intakeId, dbEntityId, apiDetail);
                }
            }

            // Build response
            IntakeResponse response = new IntakeResponse(intakeId, "COMPLETED");
            response.setMessage("Successfully saved intake with " + savedEntities.size() + " entity(ies): " + String.join(", ", savedEntities));
            response.setKeyspace("metadata"); // Stored in metadata schema
            response.setTableName(String.join(", ", savedEntities));

            return response;

        } catch (Exception e) {
            IntakeResponse response = new IntakeResponse(intakeId, "FAILED");
            response.setMessage("Failed to save intake: " + e.getMessage());
            throw new RuntimeException("Intake processing failed", e);
        }
    }

    /**
     * Extract modeling results from entity data
     * The frontend may include modelingResults in the entity or as a separate field
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> extractModelingResult(Map<String, Object> entity) {
        // Check if modelingResults is directly in the entity
        Object modelingResultsObj = entity.get("modelingResults");
        if (modelingResultsObj instanceof Map) {
            return (Map<String, Object>) modelingResultsObj;
        }

        // Check if it's nested under a key
        Object resultObj = entity.get("result");
        if (resultObj instanceof Map) {
            return (Map<String, Object>) resultObj;
        }

        return null;
    }

    private String generateIntakeId(IntakeRequest request) {
        // Use ODP Intake ID from form, or generate UUID
        if (request.getProjectDetails() != null) {
            Object odpId = request.getProjectDetails().get("odpIntakeId");
            if (odpId != null && !odpId.toString().isEmpty()) {
                return odpId.toString();
            }
        }
        return "INTAKE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }
}

