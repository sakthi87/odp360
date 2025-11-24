package com.odp.datacatalog.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentDetailsResponse {
    private ComponentResponse component;
    private Map<String, Object> schema; // Table schema, API endpoints, etc.
    private List<LineageRelationshipResponse> upstreamLineage; // Sources
    private List<LineageRelationshipResponse> downstreamLineage; // Targets
    private Map<String, Object> additionalMetadata;
}

