package com.odp.datacatalog.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentResponse {
    private Long id;
    private String name;
    private String displayName;
    private String description;
    private Boolean isDefault;
}

