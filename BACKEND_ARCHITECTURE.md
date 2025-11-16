# Backend Architecture: Java Spring Boot Implementation

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── cassandra/
│   │   │           └── browser/
│   │   │               ├── CassandraBrowserApplication.java
│   │   │               ├── config/
│   │   │               │   ├── CassandraConfig.java
│   │   │               │   └── ClusterConfig.java
│   │   │               ├── controller/
│   │   │               │   └── QueryController.java
│   │   │               ├── service/
│   │   │               │   ├── CassandraService.java
│   │   │               │   └── ConnectionManager.java
│   │   │               ├── model/
│   │   │               │   ├── QueryRequest.java
│   │   │               │   └── QueryResponse.java
│   │   │               └── exception/
│   │   │                   └── QueryException.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml (Maven) or build.gradle (Gradle)
└── README.md
```

## Dependencies (Maven - pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- DataStax Java Driver -->
    <dependency>
        <groupId>com.datastax.oss</groupId>
        <artifactId>java-driver-core</artifactId>
        <version>4.17.0</version>
    </dependency>
    
    <!-- Spring Boot Starter Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- CORS Support -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

## Key Components

### 1. Application Properties (application.properties)

```properties
# Server Configuration
server.port=8080

# CORS Configuration
spring.web.cors.allowed-origins=http://localhost:5173
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*

# Cassandra Default Configuration
cassandra.contact-points=localhost:9042
cassandra.local-datacenter=datacenter1
cassandra.keyspace=profile_datastore
```

### 2. Cassandra Configuration

```java
@Configuration
public class CassandraConfig {
    
    @Bean
    public CqlSession cqlSession() {
        return CqlSession.builder()
            .withLocalDatacenter("datacenter1")
            .addContactPoint(new InetSocketAddress("localhost", 9042))
            .build();
    }
}
```

### 3. Query Controller

```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class QueryController {
    
    @Autowired
    private CassandraService cassandraService;
    
    @PostMapping("/clusters/{clusterId}/keyspaces/{keyspaceName}/execute")
    public ResponseEntity<QueryResponse> executeQuery(
            @PathVariable String clusterId,
            @PathVariable String keyspaceName,
            @RequestBody QueryRequest request) {
        
        try {
            QueryResponse response = cassandraService.executeQuery(
                clusterId, keyspaceName, request.getQuery());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(QueryResponse.error(e.getMessage()));
        }
    }
}
```

### 4. Cassandra Service

```java
@Service
public class CassandraService {
    
    private final Map<String, CqlSession> sessions = new ConcurrentHashMap<>();
    
    public QueryResponse executeQuery(String clusterId, 
                                      String keyspace, 
                                      String query) {
        // Validate query (only SELECT allowed)
        if (!isSelectQuery(query)) {
            throw new IllegalArgumentException("Only SELECT queries are allowed");
        }
        
        // Get or create session
        CqlSession session = getSession(clusterId);
        
        // Execute query
        ResultSet resultSet = session.execute(
            SimpleStatement.newInstance(query)
                .setKeyspace(CqlIdentifier.fromCql(keyspace))
                .setConsistencyLevel(ConsistencyLevel.LOCAL_ONE)
                .setPageSize(100)
        );
        
        // Convert to response
        return convertToResponse(resultSet);
    }
    
    private boolean isSelectQuery(String query) {
        String normalized = query.trim().toUpperCase();
        return normalized.startsWith("SELECT");
    }
}
```

## Advantages of Spring Boot Approach

1. **Enterprise-Ready**: Built-in security, monitoring, metrics
2. **Official Driver**: Direct use of DataStax Java Driver
3. **Type Safety**: Compile-time checks, fewer runtime errors
4. **Spring Ecosystem**: Integration with Spring Security, Spring Data, etc.
5. **Production Features**: Actuator, health checks, metrics
6. **Scalability**: Better for large-scale enterprise applications

## Deployment

- **JAR File**: `java -jar cassandra-browser-backend.jar`
- **Docker**: Containerized deployment
- **Cloud**: Easy deployment to AWS, Azure, GCP
- **Kubernetes**: Native support for orchestration

## Performance Considerations

- Connection pooling handled by DataStax driver
- Prepared statements for better performance
- Async support with CompletableFuture
- Reactive support with Spring WebFlux (optional)

