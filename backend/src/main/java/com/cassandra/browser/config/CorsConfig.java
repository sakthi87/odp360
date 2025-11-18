package com.cassandra.browser.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    
    @Value("${spring.web.cors.allowed-origins:*}")
    private String allowedOrigins;
    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // If wildcard is specified, allow all origins (useful for VM deployment)
                if ("*".equals(allowedOrigins.trim())) {
                    registry.addMapping("/api/**")
                            .allowedOriginPatterns("*") // Use allowedOriginPatterns for wildcard
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                            .allowedHeaders("*")
                            .allowCredentials(false); // Cannot use credentials with wildcard
                } else {
                    // Otherwise, use specific origins from configuration
                    String[] origins = allowedOrigins.split(",");
                    for (int i = 0; i < origins.length; i++) {
                        origins[i] = origins[i].trim();
                    }
                    
                    registry.addMapping("/api/**")
                            .allowedOrigins(origins)
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                            .allowedHeaders("*")
                            .allowCredentials(false); // Not needed for this API, set to false for consistency
                }
            }
        };
    }
}

