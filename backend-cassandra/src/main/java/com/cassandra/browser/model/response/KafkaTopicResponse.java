package com.cassandra.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KafkaTopicResponse {
    private String name;
    private int partitionCount;
    private long totalMessages;
    private List<PartitionInfo> partitions;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartitionInfo {
        private int partition;
        private long beginningOffset;
        private long endOffset;
        private long currentOffset;
        private int leader;
        private List<Integer> replicas;
    }
}

