package com.cassandra.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableDetailsResponse {
    private String name;
    private String keyspace;
    private List<ColumnInfo> columns;
    private List<IndexInfo> indexes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColumnInfo {
        private String name;
        private String type;
        private String kind;
        private Integer position;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndexInfo {
        private String name;
        private String column;
        private String type;  // CQL index kind: KEYS, COMPOSITES, CUSTOM, etc.
        private String indexType;  // "CQL" for secondary index, "SOLR" for Solr search index
        private String options;  // Additional index options/configuration
    }
}

