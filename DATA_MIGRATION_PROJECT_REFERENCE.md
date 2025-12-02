# Data Migration Project - Complete Reference Guide

## Overview

This document consolidates all information needed to build a UI-driven data migration tool that extracts metadata from source systems (Cassandra clusters, Data APIs, etc.) and loads it into the Data Catalog database.

**Purpose**: Enable users to extract metadata from various sources and populate the Data Catalog through a user-friendly interface.

**Target Database**: Data Catalog (`odpmetadata` database, `metadata` schema)

---

## Table of Contents

1. [Data Catalog Target Schema](#data-catalog-target-schema)
2. [Data Migration Tool Architecture](#data-migration-tool-architecture)
3. [Connection Management](#connection-management)
4. [Cassandra Metadata Extraction](#cassandra-metadata-extraction)
5. [Data API Metadata Extraction](#data-api-metadata-extraction)
6. [Data Transformation & Mapping](#data-transformation--mapping)
7. [UI Flow & Components](#ui-flow--components)
8. [Implementation Phases](#implementation-phases)

---

## Data Catalog Target Schema

### Database Information
- **Database**: `odpmetadata`
- **Schema**: `metadata`
- **Database Type**: PostgreSQL/YugabyteDB
- **Connection**: `jdbc:postgresql://localhost:5433/odpmetadata?currentSchema=metadata`

### Core Infrastructure Tables

#### `metadata.environments`
Stores environment information (Production, Dev, UAT, IT).

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(50) | Environment name (production, dev, uat, it) |
| `display_name` | VARCHAR(100) | Human-readable name |
| `is_default` | BOOLEAN | Default environment flag |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `metadata.clusters`
Stores cluster information for different database systems.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `environment_id` | INTEGER | Foreign key to `environments.id` |
| `cluster_name` | VARCHAR(255) | Name of the cluster |
| `hosting_data_center` | VARCHAR(255) | Data center location |
| `hosted_location` | VARCHAR(255) | Hosting location |
| `hosted_rack` | VARCHAR(255) | Rack location |
| `host_name` | VARCHAR(255) | Host name |
| `ip_address` | VARCHAR(50) | IP address |
| `work_load_type` | VARCHAR(100) | Workload type (OLTP, streaming, analytics) |
| `car_id` | VARCHAR(100) | Common identifier |
| `metadata` | JSONB | Additional metadata |

**Unique Constraint**: `(environment_id, cluster_name)` (implied by business logic)

---

### Cassandra Metadata Tables

#### `metadata.cassandra_keyspaces`
Stores Cassandra keyspace metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `cluster_id` | INTEGER | Foreign key to `clusters.id` |
| `environment_id` | INTEGER | Foreign key to `environments.id` |
| `keyspace_name` | VARCHAR(255) | Name of the keyspace |
| `replication_value` | TEXT | Replication strategy (JSON or text) |
| `cluster_name` | VARCHAR(255) | Cluster name (denormalized) |
| `car_id` | VARCHAR(100) | Common identifier |
| `metadata` | JSONB | Additional metadata |

**Unique Constraint**: `(cluster_id, keyspace_name)`

#### `metadata.cassandra_tables`
Stores Cassandra table metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `keyspace_id` | INTEGER | Foreign key to `cassandra_keyspaces.id` |
| `cluster_id` | INTEGER | Foreign key to `clusters.id` |
| `environment_id` | INTEGER | Foreign key to `environments.id` |
| `table_name` | VARCHAR(255) | Name of the table |
| `keyspace_name` | VARCHAR(255) | Name of the keyspace |
| `business_line` | VARCHAR(100) | Business line classification |
| `product_line` | VARCHAR(100) | Product line classification |
| `system_of_origin_code` | VARCHAR(100) | System origin identifier |
| `estimated_storage_volume` | BIGINT | Estimated storage |
| `actual_storage_volume` | BIGINT | Actual storage |
| `estimated_tps` | INTEGER | Estimated transactions per second |
| `actual_tps` | INTEGER | Actual transactions per second |
| `solr_realtime_flag` | BOOLEAN | Solr realtime flag |
| `description` | TEXT | Table description |
| `metadata` | JSONB | Additional metadata |

**Unique Constraint**: `(keyspace_id, table_name)`

#### `metadata.cassandra_columns`
Stores Cassandra column metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `table_id` | INTEGER | Foreign key to `cassandra_tables.id` |
| `column_name` | VARCHAR(255) | Name of the column |
| `element_data_type` | VARCHAR(100) | Data type |
| `element_length` | INTEGER | Data length |
| `field_order` | INTEGER | Column position |
| `info_classification` | VARCHAR(100) | Information classification |
| `classification` | VARCHAR(100) | Classification |
| `is_pci` | BOOLEAN | PCI compliance flag |
| `required` | BOOLEAN | Required flag |
| `sai_flag` | BOOLEAN | Storage-Attached Index flag |
| `sasi_flag` | BOOLEAN | SASI index flag |
| `solr_case_flag` | BOOLEAN | Solr case flag |
| `solr_docval_flag` | BOOLEAN | Solr docval flag |
| `solr_flag_index_flag` | BOOLEAN | Solr flag index flag |
| `solr_realtime_flag` | BOOLEAN | Solr realtime flag |
| `description` | TEXT | Column description |
| `metadata` | JSONB | Additional metadata |

**Unique Constraint**: `(table_id, column_name)`

#### `metadata.cassandra_indexes`
Stores Cassandra index information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `table_id` | INTEGER | Foreign key to `cassandra_tables.id` |
| `index_name` | VARCHAR(255) | Name of the index |
| `index_type` | VARCHAR(50) | Type of index (SAI, SASI, etc.) |
| `index_definition` | TEXT | Full index definition |
| `columns` | TEXT[] | Array of column names |
| `metadata` | JSONB | Additional metadata |

---

### Data API Metadata Tables

#### `metadata.data_apis`
Stores Data API metadata including Postman collections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `environment_id` | INTEGER | Foreign key to `environments.id` |
| `api_name` | VARCHAR(255) | Name of the API |
| `api_description` | TEXT | API description |
| `api_operation_text` | TEXT | API operation text |
| `endpoint_name` | VARCHAR(500) | Endpoint identifier |
| `endpoint_path` | VARCHAR(500) | Full API path |
| `http_methods` | TEXT | Comma-separated: GET,POST,PUT,DELETE |
| `cluster_name` | VARCHAR(255) | Associated cluster |
| `keyspace_name` | VARCHAR(255) | Associated keyspace |
| `table_list_text` | TEXT | Comma-separated list of tables |
| `postman_collection_text` | TEXT | Postman collection as text |
| `postman_collection_json` | JSONB | Postman collection as JSONB |
| `data_owner_car_id` | VARCHAR(100) | Data owner identifier |
| `data_owner_car_name` | VARCHAR(255) | Data owner name |
| `owner_1_tech_name` | VARCHAR(255) | Technical owner |
| `owner_2_application_name` | VARCHAR(255) | Application owner |
| `consumer_car_id` | VARCHAR(100) | Consumer identifier |
| `consumer_car_name` | VARCHAR(255) | Consumer name |
| `domain` | VARCHAR(255) | Domain name |
| `subdomain` | VARCHAR(255) | Subdomain name |
| `prod_support_assignment_group_name` | VARCHAR(255) | Support group |
| `system_table_classification_text` | VARCHAR(100) | Classification |
| `status_text` | VARCHAR(50) | API status |
| `description` | TEXT | Description |
| `metadata` | JSONB | Additional metadata |

**Unique Constraint**: `(environment_id, api_name)`

#### `metadata.data_api_table_mappings`
Maps APIs to tables with relationship types.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `api_id` | INTEGER | Foreign key to `data_apis.id` |
| `table_name` | VARCHAR(255) | Name of the table |
| `keyspace_name` | VARCHAR(255) | Name of the keyspace |
| `relationship_type` | VARCHAR(50) | 'read', 'write', or 'read_write' |
| `metadata` | JSONB | Additional metadata |

**Unique Constraint**: `(api_id, table_name, keyspace_name)`

---

### Unified Components Table

#### `metadata.components`
Unified table for all components to enable cross-component search and lineage.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `component_type` | VARCHAR(50) | Type: 'cassandra_table', 'data_api', etc. |
| `component_subtype` | VARCHAR(50) | Subtype: 'table', 'api', etc. |
| `environment_id` | INTEGER | Foreign key to `environments.id` |
| `cassandra_table_id` | INTEGER | Foreign key to `cassandra_tables.id` (nullable) |
| `cassandra_keyspace_id` | INTEGER | Foreign key to `cassandra_keyspaces.id` (nullable) |
| `data_api_id` | INTEGER | Foreign key to `data_apis.id` (nullable) |
| `name` | VARCHAR(255) | Component name |
| `fully_qualified_name` | VARCHAR(500) | Fully qualified name (e.g., "ecommerce.user_profiles") |
| `display_name` | VARCHAR(255) | Human-readable name |
| `description` | TEXT | Component description |
| `car_id` | VARCHAR(100) | Common identifier |
| `business_line` | VARCHAR(100) | Business line |
| `product_line` | VARCHAR(100) | Product line |
| `system_of_origin_code` | VARCHAR(100) | System origin |
| `search_vector` | tsvector | Full-text search vector |
| `created_at` | TIMESTAMP | Creation timestamp |

**Component Types**:
- `cassandra_table`, `cassandra_keyspace`
- `data_api`
- `kafka_topic`, `spark_job` (future)

---

### Lineage Relationships Table

#### `metadata.lineage_relationships`
Stores data lineage relationships between components.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `source_component_id` | INTEGER | Foreign key to `components.id` (source) |
| `target_component_id` | INTEGER | Foreign key to `components.id` (target) |
| `relationship_type` | VARCHAR(50) | 'read', 'write', or 'transform' |
| `operation_type` | VARCHAR(100) | 'api_read', 'api_write', 'kafka_consume', 'spark_write', etc. |
| `description` | TEXT | Relationship description |
| `metadata` | JSONB | Additional metadata |

**Unique Constraint**: `(source_component_id, target_component_id, relationship_type, operation_type)`

**Relationship Types**:
- **read**: Source component reads from target component
- **write**: Source component writes to target component
- **transform**: Source component transforms data from target component

**Operation Types**:
- `api_read`: API reads from component
- `api_write`: API writes to component
- `kafka_consume`: Kafka topic consumed by component
- `spark_write`: Spark job writes to component

---

## Data Migration Tool Architecture

### Project Structure

```
ODP360-DataMigration/
├── frontend/                    # React UI for connections & extraction
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectionManagement.jsx
│   │   │   ├── ExtractionWizard.jsx
│   │   │   ├── JobStatus.jsx
│   │   │   └── ...
│   │   └── App.jsx
│   └── package.json
├── backend/                     # Spring Boot - extraction service
│   ├── src/main/java/
│   │   └── com/odp/migration/
│   │       ├── service/
│   │       │   ├── CassandraExtractionService.java
│   │       │   ├── DataCatalogLoadService.java
│   │       │   └── ConnectionService.java
│   │       ├── repository/
│   │       │   ├── ConnectionRepository.java
│   │       │   └── JobRepository.java
│   │       └── controller/
│   │           ├── ConnectionController.java
│   │           └── ExtractionController.java
│   └── src/main/resources/
│       └── application.properties
├── README.md
└── .gitignore
```

### Technology Stack

- **Frontend**: React.js with Vite
- **Backend**: Spring Boot (Java)
- **Database**: PostgreSQL (for connection management and job tracking)
- **Cassandra Driver**: `com.datastax.oss:java-driver-core` (for Cassandra extraction)
- **PostgreSQL Driver**: `org.postgresql:postgresql` (for Data Catalog loading)

---

## Connection Management

### Database Schema for Connections

The migration tool needs its own database (or schema) to store connection configurations and job tracking.

#### `migration.connections`
Stores connection configurations for source and target systems.

```sql
CREATE SCHEMA IF NOT EXISTS migration;

CREATE TABLE migration.connections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    connection_type VARCHAR(50) NOT NULL, -- 'cassandra', 'datacatalog', etc.
    environment VARCHAR(50), -- 'dev', 'it', 'uat', 'prod'
    config JSONB NOT NULL, -- Encrypted connection details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX idx_connections_name ON migration.connections(name);
```

**Connection Types**:
- `cassandra`: Cassandra cluster connection
- `datacatalog`: Data Catalog database connection

**Config JSONB Structure**:

For Cassandra:
```json
{
  "cluster_name": "prod-cassandra-cluster-1",
  "contact_points": ["host1:9042", "host2:9042", "host3:9042"],
  "datacenter": "datacenter1",
  "username": "cassandra",
  "password": "encrypted_password",
  "keyspace_filter": ["ecommerce", "analytics"]  // Optional: specific keyspaces
}
```

For Data Catalog:
```json
{
  "host": "localhost",
  "port": 5433,
  "database": "odpmetadata",
  "schema": "metadata",
  "username": "yugabyte",
  "password": "encrypted_password"
}
```

#### `migration.extraction_jobs`
Tracks extraction and loading jobs.

```sql
CREATE TABLE migration.extraction_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    source_connection_id INTEGER REFERENCES migration.connections(id),
    target_connection_id INTEGER REFERENCES migration.connections(id),
    extraction_type VARCHAR(50) NOT NULL, -- 'cassandra_metadata', 'data_api', etc.
    status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    progress INTEGER DEFAULT 0, -- 0-100
    total_records INTEGER,
    processed_records INTEGER,
    result JSONB, -- Detailed results
    error_message TEXT,
    logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX idx_jobs_status ON migration.extraction_jobs(status);
CREATE INDEX idx_jobs_created_at ON migration.extraction_jobs(created_at DESC);
```

**Job Status Values**:
- `pending`: Job created but not started
- `running`: Job in progress
- `completed`: Job finished successfully
- `failed`: Job failed with error
- `cancelled`: Job cancelled by user

---

## Cassandra Metadata Extraction

### Source: Cassandra System Tables

Cassandra exposes metadata through system tables that can be queried using CQL.

#### System Tables to Query

1. **`system.local` / `system.peers`**
   - Cluster information
   - Data center, rack, release version
   - Query: `SELECT * FROM system.local;`

2. **`system_schema.keyspaces`**
   - Keyspace metadata
   - Keyspace name, replication strategy, durable_writes
   - Query: `SELECT * FROM system_schema.keyspaces;`

3. **`system_schema.tables`**
   - Table metadata
   - Table name, keyspace, properties (compaction, compression, etc.)
   - Query: `SELECT * FROM system_schema.tables WHERE keyspace_name = ?;`

4. **`system_schema.columns`**
   - Column metadata
   - Column name, type, kind (partition_key, clustering, regular), position
   - Query: `SELECT * FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ?;`

5. **`system_schema.indexes`**
   - Index metadata
   - Index name, type, options
   - Query: `SELECT * FROM system_schema.indexes WHERE keyspace_name = ? AND table_name = ?;`

6. **`system.size_estimates`** (Optional)
   - Storage estimates
   - Mean partition size, partition count
   - Query: `SELECT * FROM system.size_estimates WHERE keyspace_name = ? AND table_name = ?;`

### Extraction Process

#### Step 1: Connect to Cassandra
```java
CqlSession session = CqlSession.builder()
    .addContactPoint(new InetSocketAddress(host, port))
    .withLocalDatacenter(datacenter)
    .withAuthCredentials(username, password)
    .build();
```

#### Step 2: Extract Cluster Information
```java
// Query system.local
ResultSet rs = session.execute("SELECT * FROM system.local");
Row row = rs.one();
String clusterName = row.getString("cluster_name");
String datacenter = row.getString("data_center");
String rack = row.getString("rack");
```

#### Step 3: Extract Keyspaces
```java
ResultSet rs = session.execute("SELECT * FROM system_schema.keyspaces");
for (Row row : rs) {
    String keyspaceName = row.getString("keyspace_name");
    String replication = row.getMap("replication", String.class, String.class).toString();
    // Map to cassandra_keyspaces table
}
```

#### Step 4: Extract Tables
```java
ResultSet rs = session.execute(
    "SELECT * FROM system_schema.tables WHERE keyspace_name = ?",
    keyspaceName
);
for (Row row : rs) {
    String tableName = row.getString("table_name");
    Map<String, String> compaction = row.getMap("compaction", String.class, String.class);
    // Map to cassandra_tables table
}
```

#### Step 5: Extract Columns
```java
ResultSet rs = session.execute(
    "SELECT * FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ?",
    keyspaceName, tableName
);
for (Row row : rs) {
    String columnName = row.getString("column_name");
    String dataType = row.getString("type");
    String kind = row.getString("kind"); // partition_key, clustering, regular
    int position = row.getInt("position");
    // Map to cassandra_columns table
}
```

#### Step 6: Extract Indexes
```java
ResultSet rs = session.execute(
    "SELECT * FROM system_schema.indexes WHERE keyspace_name = ? AND table_name = ?",
    keyspaceName, tableName
);
for (Row row : rs) {
    String indexName = row.getString("index_name");
    String indexKind = row.getString("kind");
    Map<String, String> options = row.getMap("options", String.class, String.class);
    // Map to cassandra_indexes table
}
```

### Data Mapping: Cassandra → Data Catalog

#### Cluster Mapping
```
system.local.cluster_name → clusters.cluster_name
system.local.data_center → clusters.hosting_data_center
system.local.rack → clusters.hosted_rack
User-selected Environment → environments.name (via connection config)
```

#### Keyspace Mapping
```
system_schema.keyspaces.keyspace_name → cassandra_keyspaces.keyspace_name
system_schema.keyspaces.replication → cassandra_keyspaces.replication_value
Connection cluster_id → cassandra_keyspaces.cluster_id
Connection environment → cassandra_keyspaces.environment_id
```

#### Table Mapping
```
system_schema.tables.table_name → cassandra_tables.table_name
system_schema.tables.keyspace_name → cassandra_tables.keyspace_name
Keyspace ID → cassandra_tables.keyspace_id
Cluster ID → cassandra_tables.cluster_id
Environment ID → cassandra_tables.environment_id
system.size_estimates → cassandra_tables.actual_storage_volume (if available)
```

#### Column Mapping
```
system_schema.columns.column_name → cassandra_columns.column_name
system_schema.columns.type → cassandra_columns.element_data_type
system_schema.columns.kind → Determine if partition_key, clustering, or regular
system_schema.columns.position → cassandra_columns.field_order
Table ID → cassandra_columns.table_id
```

#### Index Mapping
```
system_schema.indexes.index_name → cassandra_indexes.index_name
system_schema.indexes.kind → cassandra_indexes.index_type
system_schema.indexes.options → cassandra_indexes.index_definition
system_schema.indexes.target → cassandra_indexes.columns (array)
Table ID → cassandra_indexes.table_id
```

### Handling Missing Data

Some fields in Data Catalog are not available in Cassandra system tables:

- **business_line**, **product_line**: Not in Cassandra → Leave NULL, allow manual enrichment later
- **description**: Not in Cassandra → Leave NULL
- **car_id**: Not in Cassandra → Leave NULL
- **actual_storage_volume**: Use `system.size_estimates` if available, otherwise NULL
- **actual_tps**: Not available in Cassandra → Leave NULL

---

## Data API Metadata Extraction

### Source: TBD

**Note**: The source system for Data API information needs to be identified. Based on the screenshot reference, it appears to be stored in a database table.

### Questions to Answer:
1. Where is the API information stored?
   - Database table? Which database?
   - CSV/Excel file?
   - API registry/service?
2. What is the table/file structure?
3. What fields are available?
4. How to access it?

### Expected Mapping

Once source is identified, map to `metadata.data_apis`:

```
Source API Name → data_apis.api_name
Source Endpoint → data_apis.endpoint_path
Source HTTP Methods → data_apis.http_methods
Source Cluster → data_apis.cluster_name
Source Keyspace → data_apis.keyspace_name
Source Tables → data_apis.table_list_text
Source Postman Collection → data_apis.postman_collection_json
Source Owner Info → data_apis.data_owner_car_name, owner_1_tech_name
Source Domain → data_apis.domain, subdomain
Connection Environment → data_apis.environment_id
```

---

## Data Transformation & Mapping

### Transformation Rules

#### 1. Environment Mapping
- User selects environment when creating connection
- Map to `environments` table (create if doesn't exist)
- Use environment ID for all related records

#### 2. Cluster Handling
- Check if cluster exists in `clusters` table
- If exists: Use existing cluster_id
- If not: Create new cluster record
- Match by: `(environment_id, cluster_name)`

#### 3. Keyspace Handling
- Check if keyspace exists in `cassandra_keyspaces` table
- If exists: Update if needed, use existing keyspace_id
- If not: Create new keyspace record
- Match by: `(cluster_id, keyspace_name)`

#### 4. Table Handling
- Check if table exists in `cassandra_tables` table
- Load strategy options:
  - **Full Load**: Truncate and reload (delete existing, insert new)
  - **Incremental**: Update existing, insert new
  - **Skip Existing**: Only insert new tables
- Match by: `(keyspace_id, table_name)`

#### 5. Column Handling
- For each table, extract columns
- Delete existing columns for table (if full load)
- Insert all columns
- Match by: `(table_id, column_name)`

#### 6. Index Handling
- For each table, extract indexes
- Delete existing indexes for table (if full load)
- Insert all indexes
- Match by: `(table_id, index_name)`

#### 7. Component Entry Creation
- After loading table, create entry in `components` table
- Set `component_type = 'cassandra_table'`
- Set `cassandra_table_id` to table ID
- Set `name` to table name
- Set `fully_qualified_name` to `keyspace_name.table_name`
- Set `display_name` to table name
- Generate `search_vector` for full-text search

### Data Validation

Before loading, validate:
1. Required fields are not NULL
2. Foreign key references exist (environment_id, cluster_id, keyspace_id)
3. Data types match expected types
4. Unique constraints are satisfied

### Error Handling

- **Connection Errors**: Log and return error to user
- **Partial Extraction Errors**: Continue with other keyspaces/tables, log errors
- **Data Validation Errors**: Skip invalid records, log warnings
- **Database Errors**: Rollback transaction if possible, log error

---

## UI Flow & Components

### 1. Connection Management Page

**Purpose**: Create and manage source and target connections.

**Components**:
- Connection list (tabs: Cassandra Connections, Data Catalog Connections)
- Add Connection form
- Test Connection button
- Edit/Delete actions

**UI Mockup**:
```
┌─────────────────────────────────────────┐
│  Connection Management                  │
├─────────────────────────────────────────┤
│  [Cassandra] [Data Catalog]            │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ + Add Cassandra Connection       │  │
│  │                                  │  │
│  │ Connection Name: [________]    │  │
│  │ Environment: [PROD ▼]          │  │
│  │ Cluster Name: [________]       │  │
│  │ Contact Points: [________]     │  │
│  │   (comma-separated)            │  │
│  │ Datacenter: [________]          │  │
│  │ Username: [________]            │  │
│  │ Password: [****]                │  │
│  │ Keyspace Filter (optional):    │  │
│  │   [ecommerce] [analytics]      │  │
│  │                                 │  │
│  │ [Test Connection] [Save]       │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Existing Connections:                 │
│  • PROD Cluster 1 [Edit] [Delete]     │
│  • UAT Cluster 1 [Edit] [Delete]      │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Extraction Wizard Page

**Purpose**: Configure and execute metadata extraction.

**Components**:
- Source/Target selection
- Extraction options
- Preview
- Execute button
- Progress indicator

**UI Mockup**:
```
┌─────────────────────────────────────────┐
│  Extract Cassandra Metadata            │
├─────────────────────────────────────────┤
│                                         │
│  Source Connection:                    │
│  [PROD Cluster 1 ▼]                   │
│                                         │
│  Target Connection:                    │
│  [Data Catalog - YugabyteDB ▼]        │
│                                         │
│  Extraction Options:                    │
│  ☑ Extract Keyspaces                   │
│  ☑ Extract Tables                       │
│  ☑ Extract Columns                     │
│  ☑ Extract Indexes                      │
│  ☐ Extract Storage Estimates           │
│                                         │
│  Keyspace Filter:                       │
│  ○ All Keyspaces                        │
│  ● Selected Keyspaces                   │
│    [ecommerce] [analytics] [system]    │
│                                         │
│  Load Strategy:                        │
│  ○ Full Load (Truncate & Reload)       │
│  ● Incremental (Update Existing)       │
│                                         │
│  [Preview] [Extract & Load]           │
│                                         │
└─────────────────────────────────────────┘
```

**Preview Modal**:
```
┌─────────────────────────────────────────┐
│  Extraction Preview                     │
├─────────────────────────────────────────┤
│                                         │
│  Will extract:                          │
│  • 15 keyspaces                         │
│  • 120 tables                           │
│  • ~500 columns                         │
│  • ~30 indexes                          │
│                                         │
│  Estimated time: ~2 minutes            │
│                                         │
│  [Cancel] [Proceed]                    │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Job Status Page

**Purpose**: View extraction job status and results.

**Components**:
- Job list
- Job details
- Progress bar
- Logs viewer
- Results summary

**UI Mockup**:
```
┌─────────────────────────────────────────┐
│  Extraction Jobs                        │
├─────────────────────────────────────────┤
│                                         │
│  Job #12345 - Extract Cassandra        │
│  Status: [●] In Progress              │
│                                         │
│  Progress:                              │
│  [████████░░░░░░░░] 60%                 │
│                                         │
│  Details:                               │
│  ✓ Connected to Cassandra              │
│  ✓ Extracted 15 keyspaces              │
│  ✓ Extracted 120 tables                │
│  ⏳ Loading columns... (45/120)         │
│                                         │
│  Results:                                │
│  • Keyspaces: 15 loaded                 │
│  • Tables: 120 loaded                   │
│  • Columns: 45/500 loaded               │
│  • Indexes: 0/30 loaded                 │
│                                         │
│  [View Logs] [Cancel]                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: MVP - Basic Cassandra Extraction

**Goals**:
- Connection management (Cassandra + Data Catalog)
- Basic extraction (keyspaces, tables, columns)
- Full load only
- Synchronous execution

**Deliverables**:
1. Connection management UI and backend
2. Cassandra extraction service
3. Data Catalog loading service
4. Basic job tracking

**Timeline**: 2-3 weeks

### Phase 2: Enhanced Features

**Goals**:
- Asynchronous job processing
- Job status tracking with progress
- Preview functionality
- Error handling and logging
- Incremental load support

**Deliverables**:
1. Job queue system
2. Real-time progress updates
3. Preview API
4. Comprehensive error handling
5. Logging system

**Timeline**: 2-3 weeks

### Phase 3: Data API Extraction

**Goals**:
- Identify API data source
- Build API extraction service
- Load into Data Catalog
- Create lineage relationships (API ↔ Table)

**Deliverables**:
1. API extraction service
2. API loading service
3. Lineage relationship creation

**Timeline**: 1-2 weeks

### Phase 4: Advanced Features

**Goals**:
- Storage estimates extraction
- Business metadata enrichment
- Scheduled extractions
- Export/Import functionality
- Data validation and quality checks

**Timeline**: 2-3 weeks

---

## API Endpoints

### Connection Management

#### Create Connection
- **Endpoint**: `POST /api/connections`
- **Request Body**:
```json
{
  "name": "PROD Cluster 1",
  "connectionType": "cassandra",
  "environment": "prod",
  "config": {
    "cluster_name": "prod-cluster",
    "contact_points": ["host1:9042", "host2:9042"],
    "datacenter": "datacenter1",
    "username": "cassandra",
    "password": "password"
  }
}
```
- **Response**: `{ "id": 1, "name": "PROD Cluster 1", ... }`

#### Test Connection
- **Endpoint**: `POST /api/connections/{id}/test`
- **Response**: `{ "success": true, "message": "Connection successful" }`

#### List Connections
- **Endpoint**: `GET /api/connections?type={connectionType}`
- **Response**: Array of connection objects

#### Delete Connection
- **Endpoint**: `DELETE /api/connections/{id}`

### Extraction

#### Start Extraction
- **Endpoint**: `POST /api/extractions`
- **Request Body**:
```json
{
  "sourceConnectionId": 1,
  "targetConnectionId": 2,
  "extractionType": "cassandra_metadata",
  "options": {
    "extractKeyspaces": true,
    "extractTables": true,
    "extractColumns": true,
    "extractIndexes": true,
    "keyspaceFilter": ["ecommerce", "analytics"],
    "loadStrategy": "incremental"
  }
}
```
- **Response**: `{ "jobId": 12345, "status": "pending" }`

#### Get Job Status
- **Endpoint**: `GET /api/extractions/jobs/{jobId}`
- **Response**:
```json
{
  "id": 12345,
  "status": "running",
  "progress": 60,
  "totalRecords": 500,
  "processedRecords": 300,
  "result": {
    "keyspaces": 15,
    "tables": 120,
    "columns": 300
  }
}
```

#### Get Job Logs
- **Endpoint**: `GET /api/extractions/jobs/{jobId}/logs`
- **Response**: `{ "logs": "..." }`

#### Cancel Job
- **Endpoint**: `POST /api/extractions/jobs/{jobId}/cancel`

#### Preview Extraction
- **Endpoint**: `POST /api/extractions/preview`
- **Request Body**: Same as Start Extraction
- **Response**:
```json
{
  "keyspaces": 15,
  "tables": 120,
  "columns": 500,
  "indexes": 30,
  "estimatedTime": "2 minutes"
}
```

---

## Security Considerations

### Connection Credentials

1. **Encryption at Rest**: Encrypt passwords in `connections.config` JSONB
2. **Encryption in Transit**: Use HTTPS for all API calls
3. **Access Control**: Only authorized users can create/manage connections
4. **Credential Masking**: Never display passwords in UI, only show masked values

### Database Access

1. **Connection Pooling**: Use connection pooling for Data Catalog database
2. **Transaction Management**: Use transactions for data loading
3. **Error Handling**: Rollback on errors, don't leave partial data

---

## Error Handling

### Connection Errors
- **Invalid credentials**: Return clear error message
- **Network timeout**: Retry with exponential backoff
- **Connection refused**: Check host/port configuration

### Extraction Errors
- **Partial failures**: Continue with other keyspaces/tables, log errors
- **Data validation errors**: Skip invalid records, log warnings
- **Database errors**: Rollback transaction, return error

### Job Errors
- **Job failure**: Mark job as failed, store error message
- **Job cancellation**: Gracefully stop extraction, mark as cancelled

---

## Testing Strategy

### Unit Tests
- Connection service tests
- Extraction service tests
- Data transformation tests
- Mapping logic tests

### Integration Tests
- End-to-end extraction flow
- Database loading tests
- Error handling tests

### Manual Testing
- Test with real Cassandra clusters
- Test with different environments
- Test with large datasets
- Test error scenarios

---

## Future Enhancements

1. **Kafka Topic Extraction**: Extract metadata from Kafka clusters
2. **Spark Job Extraction**: Extract metadata from Spark clusters
3. **Scheduled Extractions**: Automatically run extractions on schedule
4. **Change Detection**: Detect changes in source and update only changed records
5. **Data Quality Checks**: Validate data quality during extraction
6. **Export/Import**: Export metadata to JSON/CSV for backup
7. **Multi-tenant Support**: Support multiple organizations/tenants
8. **Audit Trail**: Track all extraction activities
9. **Notifications**: Email/Slack notifications on job completion/failure
10. **Dashboard**: Analytics dashboard for extraction metrics

---

## Related Documentation

- `DATA_CATALOG_DESIGN.md` - Original Data Catalog design
- `DATA_CATALOG_DATABASE_SCHEMA.md` - Complete Data Catalog schema documentation
- `ODP_INTAKE_DATABASE_SCHEMA.md` - ODP Intake schema (for reference)

---

**Last Updated**: 2025-01-28
**Version**: 1.0
**Status**: Planning Phase

