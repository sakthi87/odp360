package com.cassandra.browser.service;

import com.cassandra.browser.model.response.KafkaTopicResponse;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ListTopicsResult;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class KafkaMetadataService {
    
    @Autowired
    private KafkaConnectionManager connectionManager;
    
    public List<String> listTopics(String clusterId) throws ExecutionException, InterruptedException {
        AdminClient adminClient = connectionManager.getAdminClient(clusterId);
        ListTopicsResult topicsResult = adminClient.listTopics();
        return new ArrayList<>(topicsResult.names().get());
    }
    
    public KafkaTopicResponse getTopicDetails(String clusterId, String topicName) 
            throws ExecutionException, InterruptedException {
        AdminClient adminClient = connectionManager.getAdminClient(clusterId);
        KafkaConsumer<String, String> consumer = connectionManager.getConsumer(clusterId);
        
        // Get topic description
        Map<String, TopicDescription> topics = adminClient.describeTopics(Collections.singletonList(topicName))
                .allTopicNames()
                .get();
        
        TopicDescription topicDescription = topics.get(topicName);
        if (topicDescription == null) {
            throw new IllegalArgumentException("Topic not found: " + topicName);
        }
        
        // Get partition offsets
        List<TopicPartition> partitions = topicDescription.partitions().stream()
                .map(p -> new TopicPartition(topicName, p.partition()))
                .collect(Collectors.toList());
        
        Map<TopicPartition, Long> beginningOffsets = consumer.beginningOffsets(partitions);
        Map<TopicPartition, Long> endOffsets = consumer.endOffsets(partitions);
        
        List<KafkaTopicResponse.PartitionInfo> partitionInfos = new ArrayList<>();
        long totalMessages = 0;
        
        for (org.apache.kafka.common.TopicPartitionInfo partitionInfo : topicDescription.partitions()) {
            TopicPartition tp = new TopicPartition(topicName, partitionInfo.partition());
            long beginningOffset = beginningOffsets.getOrDefault(tp, 0L);
            long endOffset = endOffsets.getOrDefault(tp, 0L);
            totalMessages += (endOffset - beginningOffset);
            
            partitionInfos.add(new KafkaTopicResponse.PartitionInfo(
                    partitionInfo.partition(),
                    beginningOffset,
                    endOffset,
                    endOffset, // current offset (latest)
                    partitionInfo.leader().id(),
                    partitionInfo.replicas().stream().map(r -> r.id()).collect(Collectors.toList())
            ));
        }
        
        return new KafkaTopicResponse(
                topicName,
                topicDescription.partitions().size(),
                totalMessages,
                partitionInfos
        );
    }
}

