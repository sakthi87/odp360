package com.cassandra.browser.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KafkaConsumeRequest {
    @NotBlank(message = "Topic name is required")
    private String topic;
    
    private Integer partition; // null means all partitions
    private Long offset; // null means latest
    private Integer maxMessages; // default 100
    private String consumerGroup; // optional
    private Boolean fromBeginning; // default false
}

