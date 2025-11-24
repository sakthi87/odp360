package com.kafka.browser.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KafkaMessageResponse {
    private String topic;
    private int partition;
    private long offset;
    private Long timestamp;
    private String key;
    private String value;
    private Map<String, String> headers;
    private String keyFormat; // STRING, JSON, AVRO, etc.
    private String valueFormat; // STRING, JSON, AVRO, etc.
}

