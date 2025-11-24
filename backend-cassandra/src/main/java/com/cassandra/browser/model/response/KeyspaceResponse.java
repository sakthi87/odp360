package com.cassandra.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KeyspaceResponse {
    private String name;
    private Map<String, String> replication;
}

