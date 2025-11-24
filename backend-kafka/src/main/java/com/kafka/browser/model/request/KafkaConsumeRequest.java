package com.kafka.browser.model.request;

import lombok.Data;

@Data
public class KafkaConsumeRequest {
    // Topic is set from path parameter, not validated here
    private String topic;
    
    private Integer partition; // null means all partitions
    private Long offset; // null means latest
    private Integer maxMessages; // default 100
    private String consumerGroup; // optional
    private Boolean fromBeginning; // default false
}

