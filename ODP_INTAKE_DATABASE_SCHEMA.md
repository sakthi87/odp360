# ODP Intake Database Schema Documentation

## Overview

The ODP Intake system stores all intake form submissions in a PostgreSQL database using the `metadata` schema. This includes project details, Cassandra entity definitions with generated CQL scripts, and API performance requirements. The system provides a complete audit trail of all data modeling decisions and intake submissions.

---

## Database Schema

### Schema Location
- **Database**: `odpmetadata`
- **Schema**: `metadata`
- **Database Type**: PostgreSQL/YugabyteDB

---

## Tables

### 1. `metadata.intake_projects` (Parent Table)

**Purpose**: Stores project-level information from the ODP Intake form.

#### Table Structure

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `intake_id` | VARCHAR(255) | PRIMARY KEY | Auto-generated unique identifier (e.g., "INTAKE-99C5CB0D") |
| `edai_req_id` | VARCHAR(255) | | EDAI requirement ID |
| `fund_type` | VARCHAR(50) | | Fund type |
| `fund_value` | VARCHAR(255) | | Fund value |
| `business_line` | VARCHAR(255) | | Business line |
| `sub_domain` | VARCHAR(255) | | Sub-domain |
| `domain` | VARCHAR(255) | | Domain |
| `project_name` | VARCHAR(255) | | Project name |
| `project_description` | TEXT | | Project description |
| `tech_owner_email` | VARCHAR(255) | | Technical owner email |
| `developer_email` | VARCHAR(255) | | Developer email |
| `exp_dev_date` | DATE | | Expected development date |
| `exp_it_date` | DATE | | Expected IT date |
| `uat_date` | DATE | | UAT date |
| `prod_date` | DATE | | Production date |
| `components` | VARCHAR(255) | | Selected components (Cassandra, YugabyteDB, Kafka, etc.) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

#### Indexes
- `idx_intake_projects_edai_req_id` on `edai_req_id`
- `idx_intake_projects_project_name` on `project_name`

#### Relationships
- **One-to-Many** with `intake_cassandra_entities` (CASCADE DELETE)
- **One-to-Many** with `intake_api_details` (CASCADE DELETE)

---

### 2. `metadata.intake_cassandra_entities` (Child Table)

**Purpose**: Stores each Cassandra entity definition with generated CQL and modeling results.

#### Table Structure

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing database ID |
| `intake_id` | VARCHAR(255) | NOT NULL, FOREIGN KEY | Links to parent intake project |
| `entity_name` | VARCHAR(255) | NOT NULL | Entity name |
| `entity_description` | TEXT | | Entity description |
| `sor_of_data` | VARCHAR(255) | | Source of record |
| `retention` | VARCHAR(255) | | Data retention policy |
| `total_record` | BIGINT | | Total number of records |
| `record_size_bytes` | BIGINT | | Size of each record in bytes |
| `volume_gb_current_yr` | DECIMAL(15,2) | | Volume in GB for current year |
| `volume_gb_5_years` | DECIMAL(15,2) | | Volume in GB for 5 years |
| `keyspace` | VARCHAR(255) | | Cassandra keyspace name |
| `csv_schema` | JSONB | | CSV field definitions (name, type, description) |
| `field_attributes` | JSONB | | Field-level metadata (cardinality, business key, mutable, tenant field, time field) |
| `access_patterns` | JSONB | | All access patterns with filters, sort fields, cardinality |
| `constraints_settings` | JSONB | | Operational constraints (partition size, query volume, time-series settings) |
| `generated_cql` | TEXT | | Complete CREATE TABLE CQL statement |
| `partition_key` | JSONB | | Array of partition key fields |
| `clustering_keys` | JSONB | | Array of clustering key objects with field, order, type |
| `indexes` | JSONB | | Array of recommended indexes |
| `warnings` | JSONB | | Array of modeling warnings/recommendations |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

#### JSONB Field Structures

**`csv_schema`** Example:
```json
[
  {
    "name": "customer_id",
    "type": "uuid",
    "description": "Customer identifier"
  },
  {
    "name": "order_date",
    "type": "timestamp",
    "description": "Order date"
  }
]
```

**`field_attributes`** Example:
```json
[
  {
    "field": "customer_id",
    "cardinality": "HIGH",
    "businessKey": true,
    "mutable": false,
    "tenantField": false,
    "timeField": false
  }
]
```

**`access_patterns`** Example:
```json
[
  {
    "name": "Get orders by customer",
    "description": "Retrieve all orders for a customer",
    "filters": [
      {
        "field": "customer_id",
        "type": "EQUALITY"
      }
    ],
    "sortFields": [
      {
        "field": "order_date",
        "direction": "DESC"
      }
    ],
    "cardinality": "HIGH"
  }
]
```

**`partition_key`** Example:
```json
["customer_id"]
```

**`clustering_keys`** Example:
```json
[
  {
    "field": "order_date",
    "order": "DESC",
    "type": "ORDERING"
  }
]
```

**`indexes`** Example:
```json
[
  {
    "field": "status",
    "type": "SAI",
    "cql": "CREATE CUSTOM INDEX ..."
  }
]
```

#### Indexes
- `idx_intake_cassandra_entities_intake_id` on `intake_id`
- `idx_intake_cassandra_entities_entity_name` on `entity_name`

#### Relationships
- **Many-to-One** with `intake_projects` (via `intake_id`)
- **One-to-Many** with `intake_api_details` (via `entity_id`)

---

### 3. `metadata.intake_api_details` (Child Table)

**Purpose**: Stores API performance requirements for each access pattern.

#### Table Structure

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing database ID |
| `intake_id` | VARCHAR(255) | NOT NULL, FOREIGN KEY | Links to parent intake project |
| `entity_id` | BIGINT | FOREIGN KEY, NULLABLE | Links to specific Cassandra entity (if from auto-synced patterns) |
| `pattern_id` | VARCHAR(255) | | Links to the access pattern ID from Cassandra entity (if auto-synced) |
| `access_pattern` | VARCHAR(255) | NOT NULL | Name of the access pattern |
| `description` | TEXT | | Pattern description |
| `average_tps` | INTEGER | | Average transactions per second |
| `peak_tps` | INTEGER | | Peak transactions per second |
| `sla_in_ms` | INTEGER | | SLA in milliseconds |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

#### Indexes
- `idx_intake_api_details_intake_id` on `intake_id`
- `idx_intake_api_details_entity_id` on `entity_id`

#### Relationships
- **Many-to-One** with `intake_projects` (via `intake_id`)
- **Many-to-One** with `intake_cassandra_entities` (via `entity_id`, optional)

**Note**: `entity_id` can be `NULL` for manually added API entries that aren't linked to a Cassandra entity.

---

## Data Population Flow

### Step 1: User Fills Intake Form

The frontend collects:
- **Project Details**: Form fields (EDAI Req ID, Project Name, Domain, Business Line, etc.)
- **Cassandra Entities** (one or more):
  - CSV Schema: Fields from uploaded CSV file
  - Field Attributes: Cardinality, business keys, mutable flags, tenant fields, time fields
  - Access Patterns: Filters, sort fields, pattern-level cardinality
  - Constraints: Time-series settings, partition size expectations, query volume
- **API Details**: Auto-synced from access patterns + manual entries with TPS and SLA metrics

### Step 2: User Clicks "Generate CQL"

1. Frontend sends all access patterns to `/api/modeler/generate`
2. Backend's `CassandraModelerService` analyzes patterns and determines:
   - **Partition Keys (PK)**: Based on frequency in equality/IN filters across all patterns
   - **Clustering Keys (CK)**: Based on equality, range, and sort fields from patterns containing the PK
   - **Indexes**: For fields used in patterns that aren't part of PK or CK
   - **Warnings**: Cardinality-based recommendations and modeling concerns
3. Returns generated CQL and modeling results
4. Frontend stores results in `modelingResults` state

### Step 3: User Clicks "Submit"

Frontend sends to `/api/intake/submit`:

```json
{
  "projectDetails": {
    "edaiReqId": "...",
    "projectName": "...",
    "domain": "...",
    ...
  },
  "cassandraDetails": [
    {
      "id": "entity-123",
      "entityName": "orders",
      "csvFields": [...],
      "fieldAttributes": [...],
      "accessPatterns": [...],
      "constraints": {...},
      "modelingResults": {
        "createTableCql": "CREATE TABLE IF NOT EXISTS ...",
        "partitionKey": ["customer_id"],
        "clusteringKeys": [...],
        "indexes": [...],
        "warnings": [...]
      }
    }
  ],
  "apiDetails": [
    {
      "entityId": "entity-123",
      "patternId": "pattern-1",
      "accessPattern": "Get orders by customer",
      "description": "...",
      "averageTPS": 100,
      "peakTPS": 500,
      "slaInMs": 50
    }
  ]
}
```

### Step 4: Backend Processing (`IntakeService.processIntake`)

1. **Generate Intake ID**
   - Uses ODP Intake ID from form if provided
   - Otherwise generates UUID: `INTAKE-{8-char-UUID}`

2. **Save Project Details**
   - Calls `intakeRepository.saveProjectDetails(intakeId, projectDetails)`
   - Inserts into `metadata.intake_projects` table

3. **Process Cassandra Entities**
   - For each entity in `cassandraDetails`:
     - Extract `modelingResults` (generated CQL, PK, CK, indexes, warnings)
     - Call `intakeRepository.saveCassandraEntity(intakeId, entity, modelingResult)`
     - Store JSONB fields: `csv_schema`, `field_attributes`, `access_patterns`, `constraints_settings`
     - Store modeling results: `generated_cql`, `partition_key`, `clustering_keys`, `indexes`, `warnings`
     - Map frontend entity ID (string) to database entity ID (long) for linking API details

4. **Process API Details**
   - For each API detail in `apiDetails`:
     - Link to entity if `entityId` matches a saved entity
     - Call `intakeRepository.saveApiDetails(intakeId, dbEntityId, apiDetail)`
     - Insert into `metadata.intake_api_details` table

### Step 5: Data Storage

- All data stored in PostgreSQL `metadata` schema
- JSONB used for complex nested structures (allows querying with JSON operators)
- Foreign keys maintain referential integrity
- CASCADE DELETE ensures cleanup when intake is deleted

---

## Design Decisions

### Why JSONB?

1. **Flexibility**: Nested data structures (access patterns, field attributes) don't require multiple join tables
2. **Queryability**: PostgreSQL JSONB operators allow querying nested data
3. **Schema Evolution**: Easy to add new fields without ALTER TABLE
4. **Storage Efficiency**: Better compression than storing JSON as TEXT

### Why Separate Tables?

1. **Normalization**: Avoids data duplication
2. **Query Performance**: Easy to query by intake, entity, or API detail independently
3. **Scalability**: Supports one intake with multiple entities
4. **Flexibility**: Supports multiple API details per entity

### Why Store Generated CQL?

1. **Audit Trail**: Complete record of what was generated at submission time
2. **Reproducibility**: Can see exactly what CQL was generated for historical intakes
3. **Version Control**: Can compare different versions of modeling decisions
4. **Debugging**: Helps troubleshoot modeling issues

### Foreign Key Relationships

```
intake_projects (1)
    │
    ├──> intake_cassandra_entities (many)
    │         │
    │         └──> (linked via entity_id)
    │
    └──> intake_api_details (many)
              │
              └──> (optionally links to) intake_cassandra_entities
```

---

## Query Patterns

### 1. List All Intakes
```sql
SELECT 
    intake_id,
    project_name,
    edai_req_id,
    domain,
    business_line,
    created_at
FROM metadata.intake_projects
ORDER BY created_at DESC;
```

### 2. Get Intake with Entities
```sql
SELECT 
    p.*,
    e.entity_name,
    e.generated_cql,
    e.partition_key,
    e.clustering_keys,
    e.indexes
FROM metadata.intake_projects p
LEFT JOIN metadata.intake_cassandra_entities e 
    ON p.intake_id = e.intake_id
WHERE p.intake_id = ?;
```

### 3. Get Intake with API Details
```sql
SELECT 
    p.*,
    a.access_pattern,
    a.average_tps,
    a.peak_tps,
    a.sla_in_ms
FROM metadata.intake_projects p
LEFT JOIN metadata.intake_api_details a 
    ON p.intake_id = a.intake_id
WHERE p.intake_id = ?;
```

### 4. Find Entities by Name
```sql
SELECT *
FROM metadata.intake_cassandra_entities
WHERE entity_name = ?;
```

### 5. Query JSONB Fields (Access Patterns)
```sql
-- Find entities with a specific access pattern name
SELECT *
FROM metadata.intake_cassandra_entities
WHERE access_patterns @> '[{"name": "Get orders by customer"}]'::jsonb;
```

### 6. Get Complete Intake Details
```sql
SELECT 
    p.*,
    json_agg(
        json_build_object(
            'entity_name', e.entity_name,
            'generated_cql', e.generated_cql,
            'partition_key', e.partition_key,
            'clustering_keys', e.clustering_keys,
            'indexes', e.indexes,
            'api_details', (
                SELECT json_agg(
                    json_build_object(
                        'access_pattern', a.access_pattern,
                        'average_tps', a.average_tps,
                        'peak_tps', a.peak_tps,
                        'sla_in_ms', a.sla_in_ms
                    )
                )
                FROM metadata.intake_api_details a
                WHERE a.entity_id = e.id
            )
        )
    ) as entities
FROM metadata.intake_projects p
LEFT JOIN metadata.intake_cassandra_entities e 
    ON p.intake_id = e.intake_id
WHERE p.intake_id = ?
GROUP BY p.intake_id;
```

---

## API Endpoints

### Submit Intake
- **Endpoint**: `POST /api/intake/submit?clusterId={clusterId}`
- **Request Body**: `IntakeRequest` (projectDetails, cassandraDetails, apiDetails)
- **Response**: `IntakeResponse` (intakeId, status, message)

### List All Intakes
- **Endpoint**: `GET /api/intake/list`
- **Response**: Array of intake summaries (intakeId, projectName, edaiReqId, domain, etc.)

### Get Intake by ID
- **Endpoint**: `GET /api/intake/{intakeId}`
- **Response**: Complete intake details including entities and API details

---

## Benefits of This Design

1. **Complete Audit Trail**: Every intake submission is stored with full context
2. **Reproducibility**: Generated CQL is stored, allowing review of modeling decisions
3. **Linkage**: Entities are linked to their API requirements
4. **Query Flexibility**: JSONB allows complex queries on nested data
5. **Data Integrity**: Foreign keys ensure referential integrity
6. **Scalability**: Supports multiple entities and API details per intake
7. **Historical Analysis**: Can analyze trends in modeling decisions over time

---

## Database Initialization

The database schema is automatically created on application startup via:

1. **`IntakeRepository.initializeTables()`** - Annotated with `@PostConstruct`
2. **SQL Script**: `backend-intake/src/main/resources/schema.sql`
3. **Application Startup**: `IntakeApplication` calls initialization

### Manual Initialization

If needed, you can manually run the schema:

```bash
psql -h localhost -p 5432 -U subhalakshmiraj -d odpmetadata -f backend-intake/src/main/resources/schema.sql
```

---

## Configuration

### Database Connection

Configured in `backend-intake/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/odpmetadata
spring.datasource.username=subhalakshmiraj
spring.datasource.password={your-password}
spring.datasource.driver-class-name=org.postgresql.Driver
```

### Connection Pool Settings

```properties
spring.datasource.hikari.connection-timeout=2000
spring.datasource.hikari.validation-timeout=1000
spring.datasource.hikari.initialization-fail-timeout=-1
```

---

## Future Enhancements

Potential improvements to consider:

1. **Versioning**: Track changes to intake submissions over time
2. **Approval Workflow**: Add status fields and approval states
3. **Search**: Full-text search on project descriptions and entity names
4. **Export**: Export intake data to CSV/JSON for reporting
5. **Analytics**: Dashboard showing modeling trends and patterns
6. **Validation**: Pre-submit validation of CQL syntax
7. **Comparison**: Compare different versions of the same entity

---

## Related Documentation

- `CASSANDRA_DATA_MODELING_RULES.md` - Rules for determining PK, CK, and Indexes
- `CASSANDRA_MODELING_PROCESS.md` - Process for modeling Cassandra entities
- `CQLDataModel/CSV_TEST_FILES_GUIDE.md` - Sample CSV files and test scenarios

---

**Last Updated**: 2025-01-28
**Version**: 1.0

