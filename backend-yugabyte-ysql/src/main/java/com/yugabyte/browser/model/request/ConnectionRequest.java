package com.yugabyte.browser.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class ConnectionRequest {
    @NotBlank(message = "Connection name is required")
    private String name;
    
    @NotNull(message = "Hosts are required")
    private List<String> hosts;
    
    @NotBlank(message = "Datacenter/Region is required")
    private String datacenter;
    
    private String username;
    private String password;
    private String database; // PostgreSQL/YugabyteDB uses "database" instead of "keyspace"
}

