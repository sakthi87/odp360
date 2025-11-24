package com.yugabyte.browser.util;

import org.springframework.stereotype.Component;

@Component
public class QueryValidator {
    private static final int MAX_RESULT_SIZE = 1000;
    
    public void validateQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            throw new IllegalArgumentException("Query cannot be empty");
        }
        
        String normalized = query.trim().toUpperCase();
        
        // Only allow SELECT queries
        if (!normalized.startsWith("SELECT")) {
            throw new IllegalArgumentException("Only SELECT queries are allowed");
        }
        
        // Prevent dangerous operations
        String[] dangerousKeywords = {
            "DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", 
            "INSERT", "UPDATE", "GRANT", "REVOKE", "EXEC", "EXECUTE"
        };
        
        for (String keyword : dangerousKeywords) {
            if (normalized.contains(" " + keyword + " ") || 
                normalized.contains("\n" + keyword + " ") ||
                normalized.contains("\t" + keyword + " ")) {
                throw new IllegalArgumentException("Query contains prohibited operation: " + keyword);
            }
        }
    }
    
    public int getMaxResultSize() {
        return MAX_RESULT_SIZE;
    }
}

