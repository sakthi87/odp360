package com.yugabyte.browser.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QueryRequest {
    @NotBlank(message = "Query is required")
    private String query;
}

