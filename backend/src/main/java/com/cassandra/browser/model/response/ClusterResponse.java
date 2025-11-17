package com.cassandra.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClusterResponse {
    private String clusterId;
    private String name;
    private String status;
    private String datacenter;
}

