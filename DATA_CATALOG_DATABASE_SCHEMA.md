# Data Catalog Database Schema Documentation

## Overview

The Data Catalog is a comprehensive metadata management system that enables users to search, discover, and understand data assets across multiple components including Cassandra tables, YugabyteDB tables, Data APIs, Kafka topics, and Spark jobs. It provides unified search capabilities, component details, and data lineage visualization to understand data flow between components.

Unlike the ODP Intake system (which stores form submissions), the Data Catalog stores **operational metadata** about existing components in production environments. This metadata is typically populated through automated discovery processes, manual entry, or integration with existing systems.

---

## Database Schema

### Schema Location
- **Database**: `odpmetadata`
- **Schema**: `metadata`
- **Database Type**: PostgreSQL/YugabyteDB

---

## Tables

### 1. Core Infrastructure Tables

#### `metadata.environments`

**Purpose**: Stores environment information (Production, Dev, UAT, IT).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Environment name (production, dev, uat, it) |
| `display_name` | VARCHAR(100) | NOT NULL | Human-readable name |
| `description` | TEXT | | Environment description |
| `is_default` | BOOLEAN | DEFAULT FALSE | Flag for default environment |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

#### `metadata.clusters`

**Purpose**: Stores cluster information for different database systems.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `car_id` | VARCHAR(100) | | Common identifier for asset management |
| `cluster_name` | VARCHAR(255) | NOT NULL | Name of the cluster |
| `hosted_location` | VARCHAR(255) | | Hosting location |
| `hosted_rack` | VARCHAR(255) | | Rack location |
| `hosting_data_center` | VARCHAR(255) | | Data center location |
| `host_name` | VARCHAR(255) | | Host name |
| `ip_address` | VARCHAR(50) | | IP address |
| `hosting_zone` | VARCHAR(100) | | Hosting zone |
| `work_load_type` | VARCHAR(100) | | Type of workload (OLTP, streaming, analytics) |
| `node_status_code` | VARCHAR(50) | | Node status |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

#### `metadata.servers`

**Purpose**: Stores server-level metrics and information.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `cluster_id` | INTEGER | FOREIGN KEY | References `clusters.id` |
| `available_storage` | BIGINT | | Available storage capacity |
| `available_trans_per_second` | INTEGER | | Available transactions per second |
| `curr_trans_per_second` | INTEGER | | Current transactions per second |
| `current_storage` | BIGINT | | Current storage usage |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

---

### 2. Cassandra Metadata Tables

#### `metadata.cassandra_keyspaces`

**Purpose**: Stores Cassandra keyspace metadata.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `cluster_id` | INTEGER | FOREIGN KEY | References `clusters.id` |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `car_id` | VARCHAR(100) | | Common identifier |
| `keyspace_name` | VARCHAR(255) | NOT NULL | Name of the keyspace |
| `environment_value` | VARCHAR(50) | | Environment value |
| `replication_value` | TEXT | | Replication strategy (JSON or text) |
| `cluster_name` | VARCHAR(255) | | Cluster name |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

**Unique Constraint**: `(cluster_id, keyspace_name)`

#### `metadata.cassandra_tables`

**Purpose**: Stores Cassandra table metadata.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `keyspace_id` | INTEGER | FOREIGN KEY | References `cassandra_keyspaces.id` |
| `cluster_id` | INTEGER | FOREIGN KEY | References `clusters.id` |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `car_id` | VARCHAR(100) | | Common identifier |
| `table_name` | VARCHAR(255) | NOT NULL | Name of the table |
| `keyspace_name` | VARCHAR(255) | NOT NULL | Name of the keyspace |
| `business_line` | VARCHAR(100) | | Business line classification |
| `product_line` | VARCHAR(100) | | Product line classification |
| `system_of_origin_code` | VARCHAR(100) | | System origin identifier |
| `estimated_storage_volume` | BIGINT | | Estimated storage |
| `actual_storage_volume` | BIGINT | | Actual storage |
| `estimated_tps` | INTEGER | | Estimated transactions per second |
| `actual_tps` | INTEGER | | Actual transactions per second |
| `solr_realtime_flag` | BOOLEAN | DEFAULT FALSE | Solr realtime flag |
| `description` | TEXT | | Table description |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

**Unique Constraint**: `(keyspace_id, table_name)`

#### `metadata.cassandra_columns`

**Purpose**: Stores Cassandra column metadata.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `table_id` | INTEGER | FOREIGN KEY | References `cassandra_tables.id` |
| `column_name` | VARCHAR(255) | NOT NULL | Name of the column |
| `car_id` | VARCHAR(100) | | Common identifier |
| `element_data_type` | VARCHAR(100) | | Data type |
| `element_length` | INTEGER | | Data length |
| `field_order` | INTEGER | | Column position |
| `info_classification` | VARCHAR(100) | | Information classification |
| `classification` | VARCHAR(100) | | Classification |
| `is_pci` | BOOLEAN | DEFAULT FALSE | PCI compliance flag |
| `pre_applied_security` | TEXT | | Pre-applied security |
| `required` | BOOLEAN | DEFAULT FALSE | Required flag |
| `sai_flag` | BOOLEAN | DEFAULT FALSE | Storage-Attached Index flag |
| `sasi_flag` | BOOLEAN | DEFAULT FALSE | SASI index flag |
| `solr_case_flag` | BOOLEAN | DEFAULT FALSE | Solr case flag |
| `solr_docval_flag` | BOOLEAN | DEFAULT FALSE | Solr docval flag |
| `solr_flag_index_flag` | BOOLEAN | DEFAULT FALSE | Solr flag index flag |
| `solr_realtime_flag` | BOOLEAN | DEFAULT FALSE | Solr realtime flag |
| `description` | TEXT | | Column description |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

**Unique Constraint**: `(table_id, column_name)`

#### `metadata.cassandra_indexes`

**Purpose**: Stores Cassandra index information.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `table_id` | INTEGER | FOREIGN KEY | References `cassandra_tables.id` |
| `index_name` | VARCHAR(255) | NOT NULL | Name of the index |
| `index_type` | VARCHAR(50) | | Type of index (SAI, SASI, etc.) |
| `index_definition` | TEXT | | Full index definition |
| `columns` | TEXT[] | | Array of column names |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

---

### 3. YugabyteDB Metadata Tables

#### `metadata.yugabyte_databases`

**Purpose**: Stores YugabyteDB database metadata.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `cluster_id` | INTEGER | FOREIGN KEY | References `clusters.id` |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `car_id` | VARCHAR(100) | | Common identifier |
| `database_name` | VARCHAR(255) | NOT NULL | Name of the database |
| `owner` | VARCHAR(255) | | Database owner |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

**Unique Constraint**: `(cluster_id, database_name)`

#### `metadata.yugabyte_tables`

**Purpose**: Stores YugabyteDB table metadata (similar structure to `cassandra_tables`).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `database_id` | INTEGER | FOREIGN KEY | References `yugabyte_databases.id` |
| `cluster_id` | INTEGER | FOREIGN KEY | References `clusters.id` |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `car_id` | VARCHAR(100) | | Common identifier |
| `table_name` | VARCHAR(255) | NOT NULL | Name of the table |
| `database_name` | VARCHAR(255) | NOT NULL | Name of the database |
| `business_line` | VARCHAR(100) | | Business line classification |
| `product_line` | VARCHAR(100) | | Product line classification |
| `system_of_origin_code` | VARCHAR(100) | | System origin identifier |
| `estimated_storage_volume` | BIGINT | | Estimated storage |
| `actual_storage_volume` | BIGINT | | Actual storage |
| `estimated_tps` | INTEGER | | Estimated transactions per second |
| `actual_tps` | INTEGER | | Actual transactions per second |
| `description` | TEXT | | Table description |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

**Unique Constraint**: `(database_id, table_name)`

#### `metadata.yugabyte_columns`

**Purpose**: Stores YugabyteDB column metadata (similar structure to `cassandra_columns`).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `table_id` | INTEGER | FOREIGN KEY | References `yugabyte_tables.id` |
| `column_name` | VARCHAR(255) | NOT NULL | Name of the column |
| `data_type` | VARCHAR(100) | | Data type |
| `is_nullable` | BOOLEAN | | Nullable flag |
| `default_value` | TEXT | | Default value |
| `field_order` | INTEGER | | Column position |
| `info_classification` | VARCHAR(100) | | Information classification |
| `classification` | VARCHAR(100) | | Classification |
| `is_pci` | BOOLEAN | DEFAULT FALSE | PCI compliance flag |
| `description` | TEXT | | Column description |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

**Unique Constraint**: `(table_id, column_name)`

---

### 4. Data API Metadata Tables

#### `metadata.data_apis`

**Purpose**: Stores Data API metadata including Postman collections.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `api_name` | VARCHAR(255) | NOT NULL | Name of the API |
| `api_description` | TEXT | | API description |
| `api_operation_text` | TEXT | | API operation text |
| `endpoint_name` | VARCHAR(500) | | Endpoint identifier |
| `endpoint_path` | VARCHAR(500) | | Full API path |
| `http_methods` | TEXT | | Comma-separated list: GET,POST,PUT,DELETE |
| `cluster_name` | VARCHAR(255) | | Associated cluster |
| `keyspace_name` | VARCHAR(255) | | Associated keyspace |
| `table_list_text` | TEXT | | Comma-separated list of tables |
| `postman_collection_text` | TEXT | | Postman collection as text |
| `postman_collection_json` | JSONB | | Postman collection as JSONB (for GraphQL tab) |
| `data_owner_car_id` | VARCHAR(100) | | Data owner identifier |
| `data_owner_car_name` | VARCHAR(255) | | Data owner name |
| `owner_1_tech_name` | VARCHAR(255) | | Technical owner |
| `owner_2_application_name` | VARCHAR(255) | | Application owner |
| `consumer_car_id` | VARCHAR(100) | | Consumer identifier |
| `consumer_car_name` | VARCHAR(255) | | Consumer name |
| `consumer_distribution_list_email_text` | TEXT | | Consumer distribution list |
| `domain` | VARCHAR(255) | | Domain name |
| `subdomain` | VARCHAR(255) | | Subdomain name |
| `prod_support_assignment_group_name` | VARCHAR(255) | | Support group |
| `system_table_classification_text` | VARCHAR(100) | | Classification |
| `status_text` | VARCHAR(50) | | API status |
| `data_modeling_url` | VARCHAR(500) | | Data modeling URL |
| `load_ts` | TIMESTAMP | | Load timestamp |
| `z_audit_created_by_text` | VARCHAR(255) | | Audit: created by |
| `z_audit_created_ts` | TIMESTAMP | | Audit: created timestamp |
| `z_audit_event_id` | VARCHAR(100) | | Audit: event ID |
| `z_audit_last_modified_by_text` | VARCHAR(255) | | Audit: last modified by |
| `description` | TEXT | | Description |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

**Unique Constraint**: `(environment_id, api_name)`

#### `metadata.data_api_table_mappings`

**Purpose**: Maps APIs to tables with relationship types.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `api_id` | INTEGER | FOREIGN KEY | References `data_apis.id` |
| `table_name` | VARCHAR(255) | NOT NULL | Name of the table |
| `keyspace_name` | VARCHAR(255) | | Name of the keyspace |
| `relationship_type` | VARCHAR(50) | | 'read', 'write', or 'read_write' |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

**Unique Constraint**: `(api_id, table_name, keyspace_name)`

---

### 5. Kafka Metadata Tables

#### `metadata.kafka_topics`

**Purpose**: Stores Kafka topic metadata.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `cluster_id` | INTEGER | FOREIGN KEY | References `clusters.id` |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `car_id` | VARCHAR(100) | | Common identifier |
| `topic_name` | VARCHAR(255) | NOT NULL | Name of the topic |
| `cluster_name` | VARCHAR(255) | | Cluster name |
| `partition_count` | INTEGER | | Number of partitions |
| `replication_factor` | INTEGER | | Replication factor |
| `business_line` | VARCHAR(100) | | Business line classification |
| `product_line` | VARCHAR(100) | | Product line classification |
| `system_of_origin_code` | VARCHAR(100) | | System origin identifier |
| `data_owner_car_id` | VARCHAR(100) | | Data owner identifier |
| `data_owner_car_name` | VARCHAR(255) | | Data owner name |
| `schema_registry_url` | VARCHAR(500) | | Schema registry URL |
| `schema_name` | VARCHAR(255) | | Schema name |
| `description` | TEXT | | Topic description |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

**Unique Constraint**: `(cluster_id, topic_name)`

---

### 6. Spark Metadata Tables

#### `metadata.spark_jobs`

**Purpose**: Stores Spark job metadata.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `job_name` | VARCHAR(255) | NOT NULL | Name of the Spark job |
| `job_type` | VARCHAR(50) | | 'batch' or 'streaming' |
| `description` | TEXT | | Job description |
| `business_line` | VARCHAR(100) | | Business line classification |
| `product_line` | VARCHAR(100) | | Product line classification |
| `system_of_origin_code` | VARCHAR(100) | | System origin identifier |
| `data_owner_car_id` | VARCHAR(100) | | Data owner identifier |
| `data_owner_car_name` | VARCHAR(255) | | Data owner name |
| `owner_1_tech_name` | VARCHAR(255) | | Technical owner |
| `spark_cluster_name` | VARCHAR(255) | | Spark cluster name |
| `status_text` | VARCHAR(50) | | Job status |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

**Unique Constraint**: `(environment_id, job_name)`

---

### 7. Unified Components Table

#### `metadata.components`

**Purpose**: Unified table for all components to enable cross-component search and lineage.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `component_type` | VARCHAR(50) | NOT NULL | Type: 'cassandra_table', 'data_api', 'kafka_topic', 'spark_job', etc. |
| `component_subtype` | VARCHAR(50) | | Subtype: 'table', 'column', 'api', 'topic', 'streaming', 'batch' |
| `environment_id` | INTEGER | FOREIGN KEY | References `environments.id` |
| `cassandra_table_id` | INTEGER | FOREIGN KEY | References `cassandra_tables.id` (nullable) |
| `cassandra_column_id` | INTEGER | FOREIGN KEY | References `cassandra_columns.id` (nullable) |
| `cassandra_keyspace_id` | INTEGER | FOREIGN KEY | References `cassandra_keyspaces.id` (nullable) |
| `yugabyte_table_id` | INTEGER | FOREIGN KEY | References `yugabyte_tables.id` (nullable) |
| `yugabyte_column_id` | INTEGER | FOREIGN KEY | References `yugabyte_columns.id` (nullable) |
| `data_api_id` | INTEGER | FOREIGN KEY | References `data_apis.id` (nullable) |
| `kafka_topic_id` | INTEGER | FOREIGN KEY | References `kafka_topics.id` (nullable) |
| `spark_job_id` | INTEGER | FOREIGN KEY | References `spark_jobs.id` (nullable) |
| `name` | VARCHAR(255) | NOT NULL | Component name |
| `fully_qualified_name` | VARCHAR(500) | | Fully qualified name (e.g., "ecommerce.user_profiles") |
| `display_name` | VARCHAR(255) | | Human-readable name |
| `description` | TEXT | | Component description |
| `car_id` | VARCHAR(100) | | Common identifier |
| `business_line` | VARCHAR(100) | | Business line |
| `product_line` | VARCHAR(100) | | Product line |
| `system_of_origin_code` | VARCHAR(100) | | System origin |
| `search_vector` | tsvector | | Full-text search vector |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

**Component Types**:
- `cassandra_table`, `cassandra_column`, `cassandra_keyspace`
- `yugabyte_table`, `yugabyte_column`, `yugabyte_database`
- `data_api`, `kafka_topic`, `spark_job`

**Indexes**:
- `idx_components_type_env` on `(component_type, environment_id)`
- `idx_components_name` on `name`
- `idx_components_fqn` on `fully_qualified_name`
- `idx_components_search` on `search_vector` (GIN index)

---

### 8. Lineage Relationships Table

#### `metadata.lineage_relationships`

**Purpose**: Stores data lineage relationships between components.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `source_component_id` | INTEGER | FOREIGN KEY | References `components.id` (source) |
| `target_component_id` | INTEGER | FOREIGN KEY | References `components.id` (target) |
| `relationship_type` | VARCHAR(50) | NOT NULL | 'read', 'write', or 'transform' |
| `operation_type` | VARCHAR(100) | | Specific operation: 'kafka_consume', 'spark_write', 'api_read', 'api_write', 'spark_read', etc. |
| `description` | TEXT | | Relationship description |
| `metadata` | JSONB | | Additional metadata |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

**Unique Constraint**: `(source_component_id, target_component_id, relationship_type, operation_type)`

**Indexes**:
- `idx_lineage_source` on `source_component_id`
- `idx_lineage_target` on `target_component_id`
- `idx_lineage_type` on `relationship_type`

**Relationship Types**:
- **read**: Source component reads from target component
- **write**: Source component writes to target component
- **transform**: Source component transforms data from target component

**Operation Types**:
- `kafka_consume`: Kafka topic consumed by component
- `spark_write`: Spark job writes to component
- `api_read`: API reads from component
- `api_write`: API writes to component
- `spark_read`: Spark job reads from component

---

## Data Population Flow

### Overview

Unlike the ODP Intake system (which stores form submissions), the Data Catalog stores **operational metadata** about existing components. Data can be populated through:

1. **Automated Discovery**: Scripts that scan clusters, databases, APIs, and extract metadata
2. **Manual Entry**: Users manually enter component information
3. **Integration**: Import from existing metadata systems or configuration files
4. **ODP Intake Integration**: Components created through ODP Intake can be synced to Data Catalog

### Step 1: Environment Setup

1. **Create Environments**: Insert records into `metadata.environments`
   ```sql
   INSERT INTO metadata.environments (name, display_name, is_default) 
   VALUES ('production', 'Production', true);
   ```

2. **Create Clusters**: Insert cluster information into `metadata.clusters`
   ```sql
   INSERT INTO metadata.clusters (environment_id, cluster_name, work_load_type)
   VALUES (1, 'cassandra-prod-cluster', 'OLTP');
   ```

### Step 2: Component Discovery

#### For Cassandra Tables:

1. **Discover Keyspaces**: Scan Cassandra cluster and insert into `metadata.cassandra_keyspaces`
2. **Discover Tables**: For each keyspace, scan tables and insert into `metadata.cassandra_tables`
3. **Discover Columns**: For each table, scan columns and insert into `metadata.cassandra_columns`
4. **Discover Indexes**: For each table, scan indexes and insert into `metadata.cassandra_indexes`
5. **Create Component Entry**: Insert into `metadata.components` with `component_type='cassandra_table'` and link to `cassandra_table_id`

#### For Data APIs:

1. **Discover APIs**: Scan API registry or configuration files and insert into `metadata.data_apis`
2. **Map to Tables**: Create entries in `metadata.data_api_table_mappings` to link APIs to tables
3. **Create Component Entry**: Insert into `metadata.components` with `component_type='data_api'` and link to `data_api_id`

#### For Kafka Topics:

1. **Discover Topics**: Scan Kafka cluster and insert into `metadata.kafka_topics`
2. **Create Component Entry**: Insert into `metadata.components` with `component_type='kafka_topic'` and link to `kafka_topic_id`

#### For Spark Jobs:

1. **Discover Jobs**: Scan Spark cluster or job registry and insert into `metadata.spark_jobs`
2. **Create Component Entry**: Insert into `metadata.components` with `component_type='spark_job'` and link to `spark_job_id`

### Step 3: Lineage Population

1. **Identify Relationships**: Analyze component configurations, code, or logs to identify data flow
2. **Create Lineage Entries**: Insert into `metadata.lineage_relationships`
   - Example: Kafka topic → Spark job → Cassandra table
   - Example: Data API → Cassandra table (read/write)

### Step 4: Search Vector Update

1. **Update Search Vectors**: Generate `tsvector` for full-text search on `metadata.components`
   ```sql
   UPDATE metadata.components
   SET search_vector = 
     to_tsvector('english', 
       COALESCE(name, '') || ' ' || 
       COALESCE(description, '') || ' ' || 
       COALESCE(fully_qualified_name, '')
     )
   WHERE search_vector IS NULL;
   ```

---

## Design Decisions

### Why Unified Components Table?

1. **Cross-Component Search**: Enables searching across all component types in a single query
2. **Unified Lineage**: Lineage relationships work between any component types
3. **Consistent Metadata**: Common fields (name, description, business_line) stored in one place
4. **Performance**: Single table for search with proper indexes

### Why Separate Component-Specific Tables?

1. **Type-Specific Metadata**: Each component type has unique attributes (e.g., partition_count for Kafka, job_type for Spark)
2. **Normalization**: Avoids sparse columns and NULL values
3. **Flexibility**: Easy to add new component types without altering existing tables
4. **Query Performance**: Can query specific component types efficiently

### Why Lineage Relationships Table?

1. **Flexibility**: Supports any relationship between any component types
2. **Rich Metadata**: Can store operation types, descriptions, and additional metadata
3. **Bidirectional**: Can query both upstream and downstream components
4. **Extensibility**: Easy to add new relationship types or operation types

### Why JSONB for Metadata?

1. **Flexibility**: Store component-specific metadata without schema changes
2. **Queryability**: PostgreSQL JSONB operators allow querying nested data
3. **Schema Evolution**: Easy to add new metadata fields without ALTER TABLE
4. **Storage Efficiency**: Better compression than TEXT

### Why Full-Text Search Vector?

1. **Performance**: GIN indexes on `tsvector` provide fast full-text search
2. **Relevance**: Can rank results by relevance
3. **Language Support**: PostgreSQL supports multiple languages for stemming
4. **Flexibility**: Can combine with other filters (environment, component type)

---

## Query Patterns

### 1. Search Components

```sql
-- Full-text search across all components
SELECT 
    c.id,
    c.component_type,
    c.name,
    c.fully_qualified_name,
    c.description,
    e.name as environment_name
FROM metadata.components c
JOIN metadata.environments e ON c.environment_id = e.id
WHERE c.search_vector @@ to_tsquery('user profile')
  AND c.environment_id = 1
  AND c.component_type = 'cassandra_table'
ORDER BY c.name
LIMIT 100;
```

### 2. Get Component Details

```sql
-- Get Cassandra table with columns
SELECT 
    ct.table_name,
    ct.keyspace_name,
    ct.business_line,
    ct.description,
    json_agg(
        json_build_object(
            'column_name', cc.column_name,
            'data_type', cc.element_data_type,
            'field_order', cc.field_order
        )
    ) as columns
FROM metadata.cassandra_tables ct
LEFT JOIN metadata.cassandra_columns cc ON ct.id = cc.table_id
WHERE ct.id = ?
GROUP BY ct.id, ct.table_name, ct.keyspace_name, ct.business_line, ct.description;
```

### 3. Get Upstream Lineage (Sources)

```sql
-- Get all components that feed into this component
SELECT 
    sc.id as source_id,
    sc.name as source_name,
    sc.component_type as source_type,
    lr.relationship_type,
    lr.operation_type,
    lr.description
FROM metadata.lineage_relationships lr
JOIN metadata.components sc ON lr.source_component_id = sc.id
JOIN metadata.components tc ON lr.target_component_id = tc.id
WHERE tc.id = ?
ORDER BY lr.relationship_type;
```

### 4. Get Downstream Lineage (Targets)

```sql
-- Get all components that this component feeds into
SELECT 
    tc.id as target_id,
    tc.name as target_name,
    tc.component_type as target_type,
    lr.relationship_type,
    lr.operation_type,
    lr.description
FROM metadata.lineage_relationships lr
JOIN metadata.components sc ON lr.source_component_id = sc.id
JOIN metadata.components tc ON lr.target_component_id = tc.id
WHERE sc.id = ?
ORDER BY lr.relationship_type;
```

### 5. Search with Filters

```sql
-- Search with multiple filters
SELECT 
    c.*,
    e.name as environment_name
FROM metadata.components c
JOIN metadata.environments e ON c.environment_id = e.id
WHERE (c.name ILIKE '%order%' OR c.description ILIKE '%order%')
  AND c.environment_id = 1
  AND c.component_type = 'data_api'
  AND c.business_line = 'E-Commerce'
ORDER BY c.name;
```

### 6. Get API Details with Table Mappings

```sql
-- Get API with associated tables
SELECT 
    da.api_name,
    da.endpoint_path,
    da.api_description,
    json_agg(
        json_build_object(
            'table_name', datm.table_name,
            'keyspace_name', datm.keyspace_name,
            'relationship_type', datm.relationship_type
        )
    ) as table_mappings
FROM metadata.data_apis da
LEFT JOIN metadata.data_api_table_mappings datm ON da.id = datm.api_id
WHERE da.id = ?
GROUP BY da.id, da.api_name, da.endpoint_path, da.api_description;
```

---

## API Endpoints

### Get Environments
- **Endpoint**: `GET /api/environments`
- **Response**: Array of `EnvironmentResponse` objects
- **Purpose**: List all available environments

### Search Components
- **Endpoint**: `GET /api/components/search?q={searchTerm}&environmentId={envId}&componentType={type}`
- **Query Parameters**:
  - `q`: Search term (optional)
  - `environmentId`: Filter by environment (optional)
  - `componentType`: Filter by component type (optional)
- **Response**: Array of `ComponentResponse` objects
- **Purpose**: Search components with filters

### Get Component Details
- **Endpoint**: `GET /api/components/{id}`
- **Response**: `ComponentDetailsResponse` object with:
  - Component information
  - Schema (table columns, API details, etc.)
  - Upstream lineage
  - Downstream lineage
- **Purpose**: Get detailed information about a specific component

### Get Component Lineage
- **Endpoint**: `GET /api/components/{id}/lineage`
- **Response**: `{ upstream: [...], downstream: [...] }`
- **Purpose**: Get lineage relationships for a component

---

## Frontend Integration

### Data Catalog Page (`DataCatalog.jsx`)

The frontend component provides:

1. **Search Interface**:
   - Search bar with auto-complete
   - Environment selector (defaults to Production)
   - Component type filter

2. **Search Results**:
   - List of matching components
   - Component cards with name, type, description
   - Click to view details

3. **Component Details Panel**:
   - **Overview Tab**: Basic information, metadata
   - **Schema Tab**: Table columns, API endpoints, topic partitions
   - **Lineage Tab**: Upstream and downstream relationships

4. **Lineage Visualization**:
   - Graph view showing relationships
   - Interactive nodes and edges
   - Click to navigate to related components

---

## Benefits of This Design

1. **Unified Search**: Search across all component types in one place
2. **Complete Lineage**: Understand data flow between any components
3. **Rich Metadata**: Store detailed information about each component type
4. **Flexible Schema**: JSONB allows storing component-specific metadata
5. **Performance**: Proper indexes for fast search and lineage queries
6. **Extensibility**: Easy to add new component types or relationship types
7. **Audit Trail**: Track when components were discovered and updated
8. **Environment Isolation**: Separate metadata for different environments

---

## Database Initialization

The database schema is created via:

1. **SQL Script**: `metadata-schema.sql`
2. **Example Data**: `metadata-example-data.sql` (optional, for testing)

### Manual Initialization

```bash
psql -h localhost -p 5433 -U yugabyte -d odpmetadata -f metadata-schema.sql
psql -h localhost -p 5433 -U yugabyte -d odpmetadata -f metadata-example-data.sql
```

---

## Configuration

### Database Connection

Configured in `backend-datacatalog/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/odpmetadata?currentSchema=metadata
spring.datasource.username=yugabyte
spring.datasource.password=yugabyte
spring.datasource.driver-class-name=org.postgresql.Driver
```

### Connection Pool Settings

```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

---

## Future Enhancements

Potential improvements to consider:

1. **Vector Embeddings**: Enable RAG (Retrieval-Augmented Generation) with pgvector for semantic search
2. **Automated Discovery**: Scheduled jobs to automatically discover and update component metadata
3. **Change Tracking**: Track changes to components over time
4. **Impact Analysis**: Analyze impact of component changes on downstream systems
5. **Data Quality Metrics**: Store and display data quality metrics for tables
6. **Usage Analytics**: Track component usage patterns
7. **Access Control**: Role-based access control for viewing/editing metadata
8. **Export/Import**: Export metadata to JSON/CSV for backup or migration
9. **GraphQL API**: Provide GraphQL endpoint for flexible queries
10. **Real-time Updates**: WebSocket support for real-time metadata updates

---

## Related Documentation

- `DATA_CATALOG_DESIGN.md` - Original design document
- `ODP_INTAKE_DATABASE_SCHEMA.md` - ODP Intake database schema
- `metadata-schema.sql` - Complete SQL schema
- `metadata-example-data.sql` - Example data for testing

---

**Last Updated**: 2025-01-28
**Version**: 1.0

