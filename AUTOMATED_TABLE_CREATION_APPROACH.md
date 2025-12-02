# Automated Table Creation & Data API Deployment - Implementation Approach

## Overview
This document outlines the approach to automate Cassandra table creation and Data API deployment from the ODP Intake form, eliminating manual steps and integrating with existing GitLab CI/CD + Jenkins pipeline.

## Current State
- **Manual Process**: Users manually create Cassandra tables
- **CI/CD Pipeline**: GitLab CI/CD + Jenkins automatically creates/deploys Data APIs (after manual table creation)
- **Gap**: No automation between intake form submission and table creation

## Target State
- **Automated Flow**: Intake Form → Table Creation → Data API Deployment
- **End-to-End**: User submits form → System creates table → System triggers Data API creation

---

## Architecture Overview

```
┌─────────────────┐
│  ODP Intake UI  │
│   (Frontend)    │
└────────┬────────┘
         │ Submit Form
         ▼
┌─────────────────────────────────────┐
│   Backend: Intake Service          │
│   - Validate & Store Intake Data    │
│   - Generate CQL DDL               │
│   - Execute Table Creation          │
│   - Update Metadata DB              │
└────────┬────────────────────────────┘
         │
         ├─► Store in Metadata DB (YugabyteDB)
         │
         ├─► Generate CQL CREATE TABLE
         │
         ├─► Execute via Cassandra Connection
         │
         └─► Trigger CI/CD Pipeline
             │
             ▼
┌─────────────────────────────────────┐
│   GitLab CI/CD + Jenkins            │
│   - Create Data API                  │
│   - Deploy to Environment            │
└─────────────────────────────────────┘
```

---

## Implementation Components

### 1. **Backend Service: Intake Management Service**

**Location**: New service `backend-intake` or extend `backend-datacatalog`

**Responsibilities**:
- Receive intake form submissions
- Validate form data
- Store intake requests in metadata database
- Generate CQL CREATE TABLE statements
- Execute table creation via Cassandra connection
- Trigger CI/CD pipeline
- Track status and provide feedback

**Key Classes**:
```java
// IntakeController.java
@RestController
@RequestMapping("/api/intake")
public class IntakeController {
    @PostMapping("/submit")
    public ResponseEntity<IntakeResponse> submitIntake(@RequestBody IntakeRequest request);
    
    @GetMapping("/{intakeId}/status")
    public ResponseEntity<IntakeStatusResponse> getStatus(@PathVariable String intakeId);
}

// IntakeService.java
@Service
public class IntakeService {
    // Store intake request
    public IntakeResponse submitIntake(IntakeRequest request);
    
    // Generate CQL DDL
    public String generateCQL(IntakeRequest request);
    
    // Execute table creation
    public void createTable(String clusterId, String keyspace, String cql);
    
    // Trigger CI/CD
    public void triggerDataAPICreation(String intakeId, TableInfo tableInfo);
}

// CQLGeneratorService.java
@Service
public class CQLGeneratorService {
    public String generateCreateTableStatement(TableSchema schema);
    public String generateIndexStatements(TableSchema schema);
}
```

---

### 2. **Database Schema: Intake Requests**

**Location**: Extend `metadata-schema.sql`

**New Tables**:
```sql
-- Intake Requests
CREATE TABLE metadata.intake_requests (
    id SERIAL PRIMARY KEY,
    intake_id VARCHAR(100) UNIQUE NOT NULL, -- ODP Intake ID from form
    status VARCHAR(50) NOT NULL, -- PENDING, TABLE_CREATING, TABLE_CREATED, API_CREATING, COMPLETED, FAILED
    environment_id INTEGER REFERENCES metadata.environments(id),
    cluster_id INTEGER REFERENCES metadata.clusters(id),
    
    -- Project Details
    project_name VARCHAR(255),
    business_line VARCHAR(100),
    sub_domain VARCHAR(100),
    fund_type VARCHAR(50),
    fund_value VARCHAR(100),
    source_car_id VARCHAR(100),
    consumer_car_id VARCHAR(100),
    tech_owner_email VARCHAR(255),
    developer_email VARCHAR(255),
    
    -- Dates
    exp_dev_date DATE,
    exp_it_date DATE,
    uat_date DATE,
    prod_date DATE,
    
    -- Components (JSON array)
    components JSONB,
    
    -- Generated CQL
    generated_cql TEXT,
    
    -- Table Info (after creation)
    keyspace_name VARCHAR(255),
    table_name VARCHAR(255),
    
    -- CI/CD Info
    gitlab_pipeline_id VARCHAR(100),
    jenkins_build_id VARCHAR(100),
    
    -- Error tracking
    error_message TEXT,
    error_stack_trace TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    table_created_at TIMESTAMP,
    api_deployed_at TIMESTAMP
);

-- Intake Cassandra Details (from form table)
CREATE TABLE metadata.intake_cassandra_details (
    id SERIAL PRIMARY KEY,
    intake_request_id INTEGER REFERENCES metadata.intake_requests(id) ON DELETE CASCADE,
    entity_name VARCHAR(255), -- Entity Name from form
    description TEXT,
    sor_of_data VARCHAR(100),
    retention_period VARCHAR(100),
    event_record_count BIGINT,
    total_record_count BIGINT,
    record_size_in_bytes BIGINT,
    volume_in_gb_current_year DECIMAL(10,2),
    volume_in_gb_5_years DECIMAL(10,2),
    
    -- Generated table info
    keyspace_name VARCHAR(255),
    table_name VARCHAR(255),
    cql_statement TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intake API Details (from form table)
CREATE TABLE metadata.intake_api_details (
    id SERIAL PRIMARY KEY,
    intake_request_id INTEGER REFERENCES metadata.intake_requests(id) ON DELETE CASCADE,
    access_pattern VARCHAR(255),
    description TEXT,
    average_tps INTEGER,
    peak_tps INTEGER,
    sla_in_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. **CQL Generation Logic**

**Approach**: Generate CREATE TABLE statements based on:
- Entity Name → Table Name
- Description → Table comment
- Access Patterns (from API Details) → Primary Key & Clustering Columns
- Volume estimates → Compaction strategy
- Retention Period → TTL settings

**Example CQL Generation**:
```java
public String generateCreateTableStatement(IntakeRequest request, CassandraDetail detail) {
    StringBuilder cql = new StringBuilder();
    
    // Table name from Entity Name (sanitized)
    String tableName = sanitizeTableName(detail.getEntityName());
    String keyspace = determineKeyspace(request); // Based on business line, domain, etc.
    
    cql.append("CREATE TABLE IF NOT EXISTS ")
       .append(keyspace).append(".").append(tableName)
       .append(" (\n");
    
    // Primary Key (from access patterns)
    // Default: id UUID PRIMARY KEY (if no access pattern specified)
    // Or: (partition_key, clustering_key) based on access patterns
    
    // Columns (standard + custom)
    cql.append("    id UUID PRIMARY KEY,\n");
    cql.append("    created_at TIMESTAMP,\n");
    cql.append("    updated_at TIMESTAMP,\n");
    // Add custom columns based on entity description/requirements
    
    // Table options
    cql.append(") WITH ");
    cql.append("comment = '").append(escapeString(detail.getDescription())).append("', ");
    
    // Compaction strategy based on write pattern
    if (isTimeSeriesData(detail)) {
        cql.append("compaction = {'class': 'TimeWindowCompactionStrategy'}, ");
    } else {
        cql.append("compaction = {'class': 'SizeTieredCompactionStrategy'}, ");
    }
    
    // TTL based on retention period
    if (detail.getRetentionPeriod() != null) {
        int ttlSeconds = parseRetentionPeriod(detail.getRetentionPeriod());
        // Note: TTL is per-row, not table-level
    }
    
    cql.append("gc_grace_seconds = 86400;");
    
    return cql.toString();
}
```

**Key Considerations**:
- **Primary Key Design**: Based on access patterns from API Details
- **Clustering Columns**: Based on query patterns
- **Secondary Indexes**: Based on search requirements
- **Compaction Strategy**: Based on data volume and access patterns
- **TTL**: Based on retention period

---

### 4. **Table Creation Execution**

**Integration with Existing Cassandra Connection**:
```java
@Service
public class TableCreationService {
    
    @Autowired
    private ConnectionManager connectionManager; // Reuse existing
    
    public void createTable(String clusterId, String keyspace, String cql) {
        CqlSession session = connectionManager.getSession(clusterId);
        
        try {
            // Execute CREATE TABLE
            SimpleStatement statement = SimpleStatement.newInstance(cql)
                .setTimeout(Duration.ofSeconds(60)); // Longer timeout for DDL
            
            session.execute(statement);
            
            // Verify table creation
            verifyTableExists(session, keyspace, extractTableName(cql));
            
        } catch (Exception e) {
            throw new TableCreationException("Failed to create table: " + e.getMessage(), e);
        }
    }
    
    private void verifyTableExists(CqlSession session, String keyspace, String tableName) {
        String query = String.format(
            "SELECT table_name FROM system_schema.tables " +
            "WHERE keyspace_name = '%s' AND table_name = '%s'",
            keyspace, tableName
        );
        
        ResultSet rs = session.execute(query);
        if (rs.one() == null) {
            throw new TableCreationException("Table verification failed");
        }
    }
}
```

---

### 5. **CI/CD Pipeline Integration**

**Option A: GitLab Webhook Trigger**
```java
@Service
public class CICDTriggerService {
    
    @Value("${gitlab.api.url}")
    private String gitlabApiUrl;
    
    @Value("${gitlab.token}")
    private String gitlabToken;
    
    @Value("${gitlab.project.id}")
    private String projectId;
    
    public void triggerDataAPICreation(String intakeId, TableInfo tableInfo) {
        // Prepare pipeline variables
        Map<String, String> variables = new HashMap<>();
        variables.put("INTAKE_ID", intakeId);
        variables.put("KEYSPACE", tableInfo.getKeyspace());
        variables.put("TABLE_NAME", tableInfo.getTableName());
        variables.put("CAR_ID", tableInfo.getCarId());
        variables.put("ENVIRONMENT", tableInfo.getEnvironment());
        
        // Trigger GitLab pipeline
        String pipelineUrl = gitlabApiUrl + "/projects/" + projectId + "/pipeline";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("PRIVATE-TOKEN", gitlabToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = new HashMap<>();
        body.put("ref", "main"); // or appropriate branch
        body.put("variables", variables);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map> response = restTemplate.postForEntity(
            pipelineUrl, request, Map.class
        );
        
        // Store pipeline ID
        String pipelineId = extractPipelineId(response);
        updateIntakeRequest(intakeId, "gitlab_pipeline_id", pipelineId);
    }
}
```

**Option B: Jenkins API Trigger**
```java
public void triggerJenkinsBuild(String intakeId, TableInfo tableInfo) {
    String jenkinsUrl = jenkinsBaseUrl + "/job/data-api-creation/buildWithParameters";
    
    // Jenkins requires authentication
    String auth = Base64.getEncoder().encodeToString(
        (jenkinsUser + ":" + jenkinsToken).getBytes()
    );
    
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Basic " + auth);
    
    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("INTAKE_ID", intakeId);
    params.add("KEYSPACE", tableInfo.getKeyspace());
    params.add("TABLE_NAME", tableInfo.getTableName());
    
    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
    
    RestTemplate restTemplate = new RestTemplate();
    restTemplate.postForEntity(jenkinsUrl, request, String.class);
}
```

**GitLab CI/CD Pipeline Example** (`.gitlab-ci.yml`):
```yaml
stages:
  - create-api
  - deploy

create-data-api:
  stage: create-api
  script:
    - echo "Creating Data API for table: $TABLE_NAME"
    - |
      # Your existing script to generate Data API
      # Uses variables: $INTAKE_ID, $KEYSPACE, $TABLE_NAME, $CAR_ID
      ./scripts/create-data-api.sh
  variables:
    INTAKE_ID: ""
    KEYSPACE: ""
    TABLE_NAME: ""
    CAR_ID: ""
    ENVIRONMENT: ""

deploy-api:
  stage: deploy
  script:
    - echo "Deploying Data API"
    - ./scripts/deploy-api.sh
  only:
    - main
```

---

### 6. **Workflow Orchestration**

**State Machine**:
```
PENDING → TABLE_CREATING → TABLE_CREATED → API_CREATING → COMPLETED
   │           │                │               │
   └───────────┴────────────────┴───────────────┴──→ FAILED
```

**Async Processing** (Recommended):
```java
@Service
public class IntakeWorkflowService {
    
    @Autowired
    private TaskExecutor taskExecutor; // Spring async executor
    
    public IntakeResponse submitIntake(IntakeRequest request) {
        // 1. Store intake request (PENDING)
        IntakeRequestEntity entity = storeIntakeRequest(request);
        
        // 2. Process asynchronously
        taskExecutor.execute(() -> {
            try {
                processIntakeRequest(entity.getId());
            } catch (Exception e) {
                updateStatus(entity.getId(), "FAILED", e.getMessage());
            }
        });
        
        return new IntakeResponse(entity.getIntakeId(), "PENDING");
    }
    
    private void processIntakeRequest(Long intakeId) {
        IntakeRequestEntity request = getIntakeRequest(intakeId);
        
        // Step 1: Generate CQL
        updateStatus(intakeId, "TABLE_CREATING", null);
        String cql = cqlGeneratorService.generate(request);
        updateIntakeRequest(intakeId, "generated_cql", cql);
        
        // Step 2: Create table
        tableCreationService.createTable(
            request.getClusterId(),
            request.getKeyspaceName(),
            cql
        );
        updateStatus(intakeId, "TABLE_CREATED", null);
        updateIntakeRequest(intakeId, "table_created_at", new Timestamp(System.currentTimeMillis()));
        
        // Step 3: Update metadata
        updateMetadataDatabase(request);
        
        // Step 4: Trigger CI/CD
        updateStatus(intakeId, "API_CREATING", null);
        cicdTriggerService.triggerDataAPICreation(intakeId, extractTableInfo(request));
        
        // Step 5: Poll for completion (or use webhook)
        // For now, mark as completed (CI/CD will update via webhook)
        updateStatus(intakeId, "COMPLETED", null);
    }
}
```

---

### 7. **Frontend Integration**

**Update IntakeForm.jsx**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  setSubmitting(true);
  
  try {
    const response = await fetch('http://localhost:8084/api/intake/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectDetails: formData,
        cassandraDetails: cassandraRows,
        apiDetails: apiRows
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Show success message with intake ID
      setSubmissionResult({
        intakeId: result.intakeId,
        status: result.status,
        message: 'Intake request submitted successfully!'
      });
      
      // Poll for status updates
      pollIntakeStatus(result.intakeId);
    }
  } catch (error) {
    setSubmissionResult({
      error: 'Failed to submit intake request'
    });
  } finally {
    setSubmitting(false);
  }
};

const pollIntakeStatus = async (intakeId) => {
  const interval = setInterval(async () => {
    const response = await fetch(`http://localhost:8084/api/intake/${intakeId}/status`);
    const status = await response.json();
    
    setSubmissionResult(prev => ({
      ...prev,
      status: status.status,
      message: getStatusMessage(status.status)
    }));
    
    if (status.status === 'COMPLETED' || status.status === 'FAILED') {
      clearInterval(interval);
    }
  }, 5000); // Poll every 5 seconds
};
```

---

## Implementation Steps

### Phase 1: Foundation (Week 1-2)
1. ✅ Create `backend-intake` service
2. ✅ Extend metadata schema with intake tables
3. ✅ Create IntakeController and IntakeService
4. ✅ Implement intake request storage

### Phase 2: CQL Generation (Week 2-3)
1. ✅ Implement CQLGeneratorService
2. ✅ Add table name sanitization
3. ✅ Implement primary key generation logic
4. ✅ Add compaction strategy selection

### Phase 3: Table Creation (Week 3-4)
1. ✅ Integrate with ConnectionManager
2. ✅ Implement TableCreationService
3. ✅ Add table verification
4. ✅ Error handling and rollback

### Phase 4: CI/CD Integration (Week 4-5)
1. ✅ Implement GitLab/Jenkins API integration
2. ✅ Add pipeline trigger logic
3. ✅ Implement status polling/webhooks
4. ✅ Update GitLab CI/CD pipeline

### Phase 5: Frontend & Testing (Week 5-6)
1. ✅ Update IntakeForm.jsx
2. ✅ Add status tracking UI
3. ✅ End-to-end testing
4. ✅ Error handling and user feedback

---

## Configuration

**application.properties**:
```properties
# Intake Service
server.port=8084

# GitLab Integration
gitlab.api.url=https://gitlab.example.com/api/v4
gitlab.token=your-gitlab-token
gitlab.project.id=123

# Jenkins Integration (if using)
jenkins.url=http://jenkins.example.com
jenkins.user=admin
jenkins.token=your-jenkins-token
jenkins.job.name=data-api-creation

# Metadata Database
spring.datasource.url=jdbc:postgresql://localhost:5433/odpmetadata?currentSchema=metadata
spring.datasource.username=yugabyte
spring.datasource.password=yugabyte
```

---

## Security Considerations

1. **Authentication**: Secure intake API endpoints
2. **Authorization**: Verify user permissions for table creation
3. **Input Validation**: Sanitize all user inputs
4. **CQL Injection**: Use parameterized/prepared statements where possible
5. **CI/CD Credentials**: Store securely (use secrets management)

---

## Error Handling & Rollback

1. **Table Creation Failure**: 
   - Log error
   - Update intake status to FAILED
   - Notify user
   - Optionally attempt cleanup

2. **CI/CD Failure**:
   - Table already created
   - Mark intake as PARTIAL
   - Allow manual retry of API creation

3. **Retry Logic**:
   - Implement retry for transient failures
   - Max retries: 3
   - Exponential backoff

---

## Monitoring & Logging

1. **Metrics**:
   - Intake requests per day
   - Table creation success rate
   - Average time to completion
   - CI/CD pipeline success rate

2. **Logging**:
   - All intake submissions
   - CQL generation details
   - Table creation attempts
   - CI/CD triggers

---

## Next Steps

1. **Review & Approve**: This approach document
2. **Create Backend Service**: Set up `backend-intake` service
3. **Database Migration**: Add intake tables to metadata schema
4. **Implement Core Logic**: Start with CQL generation
5. **Integration Testing**: Test with real Cassandra cluster
6. **CI/CD Integration**: Connect with existing pipeline
7. **Frontend Updates**: Add status tracking UI
8. **Documentation**: Update user guides

---

## Questions to Resolve

1. **Keyspace Naming**: How to determine keyspace from intake form? (Business Line? Domain? Manual selection?)
2. **Primary Key Design**: How to infer from access patterns? Need more details on access pattern format?
3. **Column Definition**: Should we allow users to define columns in UI, or infer from description?
4. **Environment Mapping**: How to map intake environment to deployment environment?
5. **Approval Workflow**: Do intake requests need approval before table creation?
6. **Multi-Table Support**: Can one intake request create multiple tables?

---

This approach provides a complete automation solution while leveraging your existing infrastructure. Let me know if you'd like me to start implementing any specific component!

