package com.yugabyte.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableDetailsResponse {
    private String name;
    private String database;
    private List<ColumnInfo> columns;
    private List<IndexInfo> indexes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColumnInfo {
        private String name;
        private String type;
        private Boolean isNullable;
        private String defaultValue;
        private Integer position;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndexInfo {
        private String name;
        private String columns; // Comma-separated column names
        private String type; // B-tree, Hash, GIN, GiST, etc.
        private Boolean isUnique;
        private String definition; // Full index definition
    }
}

