package com.cassandra.browser.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class KafkaConnectionRequest {
    @NotBlank(message = "Connection name is required")
    private String name;
    
    @NotNull(message = "Bootstrap servers are required")
    private List<String> bootstrapServers;
    
    private String securityProtocol; // PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
    private String saslMechanism; // PLAIN, SCRAM-SHA-256, SCRAM-SHA-512
    private String username;
    private String password;
    private String truststoreLocation;
    private String truststorePassword;
    private String keystoreLocation;
    private String keystorePassword;
}

