package com.odp.datacatalog.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LineageRelationshipResponse {
    private Long id;
    private ComponentResponse source;
    private ComponentResponse target;
    private String relationshipType; // 'read', 'write', 'transform'
    private String operationType; // 'kafka_consume', 'spark_write', 'api_read', etc.
    private String description;
    private Object metadata;
}

