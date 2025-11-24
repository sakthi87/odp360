package com.yugabyte.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DatabaseResponse {
    private String name;
    // PostgreSQL/YugabyteDB databases don't have replication info like Cassandra keyspaces
    // but we can include owner or other metadata if needed
    private String owner;
}

