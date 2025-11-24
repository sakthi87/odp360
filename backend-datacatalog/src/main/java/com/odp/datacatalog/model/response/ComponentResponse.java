package com.odp.datacatalog.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentResponse {
    private Long id;
    private String componentType;
    private String componentSubtype;
    private Long environmentId;
    private String environmentName;
    private String name;
    private String fullyQualifiedName;
    private String displayName;
    private String description;
    private String carId;
    private String businessLine;
    private String productLine;
    private String systemOfOriginCode;
    
    // Component-specific IDs
    private Long cassandraTableId;
    private Long dataApiId;
    private Long kafkaTopicId;
    private Long sparkJobId;
    
    // Additional metadata
    private Object metadata;
}

