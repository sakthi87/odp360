package com.kafka.browser.service;

import com.kafka.browser.model.request.KafkaConsumeRequest;
import com.kafka.browser.model.response.KafkaMessageResponse;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KafkaMessageService {
    
    @Autowired
    private KafkaConnectionManager connectionManager;
    
    public List<KafkaMessageResponse> consumeMessages(String clusterId, KafkaConsumeRequest request) {
        KafkaConsumer<String, String> consumer = connectionManager.getConsumer(clusterId);
        
        // Determine partitions
        List<TopicPartition> partitions;
        if (request.getPartition() != null) {
            partitions = Collections.singletonList(new TopicPartition(request.getTopic(), request.getPartition()));
        } else {
            // Get all partitions for the topic
            partitions = consumer.partitionsFor(request.getTopic()).stream()
                    .map(p -> new TopicPartition(request.getTopic(), p.partition()))
                    .collect(Collectors.toList());
        }
        
        consumer.assign(partitions);
        
        // Set offsets
        if (request.getFromBeginning() != null && request.getFromBeginning()) {
            consumer.seekToBeginning(partitions);
        } else if (request.getOffset() != null) {
            partitions.forEach(tp -> consumer.seek(tp, request.getOffset()));
        } else {
            consumer.seekToEnd(partitions);
            // Move back by maxMessages to read recent messages
            if (request.getMaxMessages() != null && request.getMaxMessages() > 0) {
                partitions.forEach(tp -> {
                    long endOffset = consumer.position(tp);
                    long startOffset = Math.max(0, endOffset - request.getMaxMessages());
                    consumer.seek(tp, startOffset);
                });
            }
        }
        
        // Consume messages
        int maxMessages = request.getMaxMessages() != null ? request.getMaxMessages() : 100;
        List<KafkaMessageResponse> messages = new ArrayList<>();
        int pollCount = 0;
        int maxPolls = 10; // Prevent infinite polling
        
        while (messages.size() < maxMessages && pollCount < maxPolls) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(1));
            
            if (records.isEmpty()) {
                break;
            }
            
            for (ConsumerRecord<String, String> record : records) {
                if (messages.size() >= maxMessages) {
                    break;
                }
                
                Map<String, String> headers = new HashMap<>();
                record.headers().forEach(header -> {
                    headers.put(header.key(), new String(header.value()));
                });
                
                messages.add(new KafkaMessageResponse(
                        record.topic(),
                        record.partition(),
                        record.offset(),
                        record.timestamp(),
                        record.key(),
                        record.value(),
                        headers,
                        "STRING",
                        "STRING"
                ));
            }
            
            pollCount++;
        }
        
        return messages;
    }
}

