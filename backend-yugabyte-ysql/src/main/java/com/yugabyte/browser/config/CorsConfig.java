package com.yugabyte.browser.config;

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
                if ("*".equals(allowedOrigins.trim())) {
                    registry.addMapping("/api/**")
                            .allowedOriginPatterns("*")
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                            .allowedHeaders("*")
                            .allowCredentials(false);
                } else {
                    String[] origins = allowedOrigins.split(",");
                    for (int i = 0; i < origins.length; i++) {
                        origins[i] = origins[i].trim();
                    }
                    
                    registry.addMapping("/api/**")
                            .allowedOrigins(origins)
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                            .allowedHeaders("*")
                            .allowCredentials(false);
                }
            }
        };
    }
}

