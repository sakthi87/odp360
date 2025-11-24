package com.yugabyte.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QueryResponse {
    private List<String> columns;
    private List<Map<String, Object>> rows;
    private int rowCount;
    private long executionTime;
    private String error;
    
    public static QueryResponse error(String errorMessage) {
        QueryResponse response = new QueryResponse();
        response.setError(errorMessage);
        return response;
    }
}

