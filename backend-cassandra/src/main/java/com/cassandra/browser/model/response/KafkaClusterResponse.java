package com.cassandra.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KafkaClusterResponse {
    private String clusterId;
    private String name;
    private String bootstrapServers;
    private String status; // CONNECTED, DISCONNECTED, ERROR
}

