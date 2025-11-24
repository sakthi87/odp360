# Data Catalog Design Documentation

## Overview

The Data Catalog is a comprehensive metadata management system that enables users to search, discover, and understand data assets across multiple components including Cassandra, YugabyteDB, Data APIs, Kafka, and Spark. It also provides data lineage visualization to understand data flow between components.

## Database Design

### Database: `odpmetadata`
### Schema: `metadata`

## Table Structure

### 1. Core Infrastructure Tables

#### `environments`
Stores environment information (Production, Dev, UAT, IT).

**Key Fields:**
- `id`: Primary key
- `name`: Environment name (production, dev, uat, it)
- `display_name`: Human-readable name
- `is_default`: Boolean flag for default environment

#### `clusters`
Stores cluster information for different database systems.

**Key Fields:**
- `id`: Primary key
- `environment_id`: Foreign key to environments
- `cluster_name`: Name of the cluster
- `hosting_data_center`: Data center location
- `work_load_type`: Type of workload (OLTP, streaming, analytics)
- `car_id`: Common identifier for asset management

#### `servers`
Stores server-level metrics and information.

**Key Fields:**
- `id`: Primary key
- `cluster_id`: Foreign key to clusters
- `available_storage`: Available storage capacity
- `current_storage`: Current storage usage
- `available_trans_per_second`: Available transactions per second

### 2. Cassandra Metadata Tables

#### `cassandra_keyspaces`
Stores Cassandra keyspace metadata.

**Key Fields:**
- `id`: Primary key
- `cluster_id`: Foreign key to clusters
- `environment_id`: Foreign key to environments
- `keyspace_name`: Name of the keyspace
- `replication_value`: Replication strategy (JSON or text)

#### `cassandra_tables`
Stores Cassandra table metadata.

**Key Fields:**
- `id`: Primary key
- `keyspace_id`: Foreign key to cassandra_keyspaces
- `table_name`: Name of the table
- `keyspace_name`: Name of the keyspace
- `business_line`: Business line classification
- `product_line`: Product line classification
- `system_of_origin_code`: System origin identifier
- `estimated_storage_volume`: Estimated storage
- `actual_storage_volume`: Actual storage
- `estimated_tps`: Estimated transactions per second
- `actual_tps`: Actual transactions per second
- `description`: Table description
- `description_embedding`: Vector embedding for RAG (vector(1536))

#### `cassandra_columns`
Stores Cassandra column metadata.

**Key Fields:**
- `id`: Primary key
- `table_id`: Foreign key to cassandra_tables
- `column_name`: Name of the column
- `element_data_type`: Data type
- `field_order`: Column position
- `info_classification`: Information classification
- `is_pci`: PCI compliance flag
- `sai_flag`, `sasi_flag`: Search index flags
- `solr_*_flag`: Solr-related flags
- `description_embedding`: Vector embedding for RAG

#### `cassandra_indexes`
Stores Cassandra index information.

**Key Fields:**
- `id`: Primary key
- `table_id`: Foreign key to cassandra_tables
- `index_name`: Name of the index
- `index_type`: Type of index
- `index_definition`: Full index definition
- `columns`: Array of column names

### 3. YugabyteDB Metadata Tables

#### `yugabyte_databases`
Stores YugabyteDB database metadata.

**Key Fields:**
- `id`: Primary key
- `cluster_id`: Foreign key to clusters
- `environment_id`: Foreign key to environments
- `database_name`: Name of the database
- `owner`: Database owner

#### `yugabyte_tables`
Stores YugabyteDB table metadata (similar structure to cassandra_tables).

#### `yugabyte_columns`
Stores YugabyteDB column metadata (similar structure to cassandra_columns).

### 4. Data API Metadata Tables

#### `data_apis`
Stores Data API metadata including Postman collections.

**Key Fields:**
- `id`: Primary key
- `environment_id`: Foreign key to environments
- `api_name`: Name of the API
- `api_description`: API description
- `endpoint_name`: Endpoint identifier
- `endpoint_path`: Full API path
- `http_method`: HTTP methods (GET, POST, PUT, DELETE)
- `cluster_name`: Associated cluster
- `keyspace_name`: Associated keyspace
- `table_list_text`: Comma-separated list of tables
- `postman_collection_text`: Postman collection as text
- `postman_collection_json`: Postman collection as JSONB (for GraphQL tab)
- `data_owner_car_id`: Data owner identifier
- `data_owner_car_name`: Data owner name
- `owner_1_tech_name`: Technical owner
- `owner_2_application_name`: Application owner
- `consumer_car_id`: Consumer identifier
- `consumer_car_name`: Consumer name
- `domain`: Domain name
- `subdomain`: Subdomain name
- `prod_support_assignment_group_name`: Support group
- `system_table_classification_text`: Classification
- `status_text`: API status
- `z_audit_*`: Audit fields
- `api_doc_embedding`: Vector embedding for API documentation
- `description_embedding`: Vector embedding for description

#### `data_api_table_mappings`
Maps APIs to tables with relationship types.

**Key Fields:**
- `id`: Primary key
- `api_id`: Foreign key to data_apis
- `table_name`: Name of the table
- `keyspace_name`: Name of the keyspace
- `relationship_type`: 'read', 'write', or 'read_write'

### 5. Kafka Metadata Tables

#### `kafka_topics`
Stores Kafka topic metadata.

**Key Fields:**
- `id`: Primary key
- `cluster_id`: Foreign key to clusters
- `environment_id`: Foreign key to environments
- `topic_name`: Name of the topic
- `partition_count`: Number of partitions
- `replication_factor`: Replication factor
- `business_line`: Business line classification
- `schema_registry_url`: Schema registry URL
- `schema_name`: Schema name
- `description_embedding`: Vector embedding for RAG

### 6. Spark Metadata Tables

#### `spark_jobs`
Stores Spark job metadata.

**Key Fields:**
- `id`: Primary key
- `environment_id`: Foreign key to environments
- `job_name`: Name of the Spark job
- `job_type`: 'batch' or 'streaming'
- `description`: Job description
- `business_line`: Business line classification
- `spark_cluster_name`: Spark cluster name
- `status_text`: Job status
- `description_embedding`: Vector embedding for RAG

### 7. Unified Components Table

#### `components`
Unified table for all components to enable cross-component search and lineage.

**Key Fields:**
- `id`: Primary key
- `component_type`: Type of component ('cassandra_table', 'data_api', 'kafka_topic', 'spark_job', etc.)
- `component_subtype`: Subtype ('table', 'column', 'api', 'topic', 'streaming', 'batch')
- `environment_id`: Foreign key to environments
- Foreign keys to specific component tables (cassandra_table_id, data_api_id, etc.)
- `name`: Component name
- `fully_qualified_name`: Fully qualified name (e.g., "ecommerce.user_profiles")
- `display_name`: Human-readable name
- `description`: Component description
- `car_id`: Common identifier
- `business_line`: Business line
- `product_line`: Product line
- `system_of_origin_code`: System origin
- `search_vector`: Full-text search vector (tsvector)
- `embedding`: Vector embedding for RAG (vector(1536))

### 8. Lineage Relationships Table

#### `lineage_relationships`
Stores data lineage relationships between components.

**Key Fields:**
- `id`: Primary key
- `source_component_id`: Foreign key to components (source)
- `target_component_id`: Foreign key to components (target)
- `relationship_type`: 'read', 'write', or 'transform'
- `operation_type`: Specific operation ('kafka_consume', 'spark_write', 'api_read', 'api_write', etc.)
- `description`: Relationship description
- `metadata`: Additional metadata (JSONB)

## Example Data Scenarios

### Example 1: Cassandra Table with Data API (Read & Write)

**Components:**
- **Table**: `ecommerce.user_profiles`
- **API**: `UserProfileAPI` (Read & Write)

**Lineage:**
```
UserProfileAPI (Write) → user_profiles
UserProfileAPI (Read) ← user_profiles
```

**Details:**
- Table stores user profile information
- API provides full CRUD operations
- Direct read and write access via API
- No intermediate components

### Example 2: Cassandra Table with Data API (Read only) + Kafka + Spark (Write)

**Components:**
- **Table**: `ecommerce.order_events`
- **API**: `OrderEventsReadAPI` (Read only)
- **Kafka Topic**: `order-events-topic`
- **Spark Job**: `OrderEventsStreamingJob` (Streaming)

**Lineage:**
```
order-events-topic (Kafka) → OrderEventsStreamingJob (Spark) → order_events (Cassandra)
OrderEventsReadAPI (Read) ← order_events (Cassandra)
```

**Details:**
- Table stores order event data for analytics
- Write path: Kafka → Spark Streaming → Cassandra
- Read path: API reads directly from Cassandra
- Separation of concerns: Write via streaming, Read via API

### Example 3: Additional Full Lineage Example

**Components:**
- **Table**: `ecommerce.product_catalog`
- **API**: `ProductCatalogAPI` (Read & Write)

**Lineage:**
```
ProductCatalogAPI (Write) → product_catalog
ProductCatalogAPI (Read) ← product_catalog
```

## Data Catalog Page Design

### 1. Search Interface

#### Search Bar
- **Location**: Top of the page
- **Features**:
  - Full-text search across all components
  - Auto-complete suggestions
  - Search filters (Component Type, Environment)
  - Search history

#### Filters Panel
- **Environment Selector**: Dropdown (Default: Production)
  - Production
  - Development
  - UAT
  - IT
- **Component Type Filter**: Multi-select checkboxes
  - Cassandra Tables
  - YugabyteDB Tables
  - Data APIs
  - Kafka Topics
  - Spark Jobs
- **Business Line Filter**: Dropdown
- **Product Line Filter**: Dropdown

### 2. Search Results Display

#### Results List View
- **Component Cards**: Each result displayed as a card
  - Component icon (based on type)
  - Component name
  - Fully qualified name
  - Description
  - Environment badge
  - Business line / Product line tags
  - Quick actions (View Details, View Lineage)

#### Results Grid View (Optional)
- Grid layout for visual browsing
- Thumbnail previews
- Quick metadata display

### 3. Component Details Panel

#### Tabbed Interface
- **Overview Tab**:
  - Component name and description
  - Fully qualified name
  - Environment
  - Business context (Business Line, Product Line, System of Origin)
  - Ownership information
  - Status
  - Metadata (JSONB display)

- **Schema Tab** (for tables):
  - Column list with data types
  - Indexes
  - Primary keys
  - Clustering keys (for Cassandra)

- **Lineage Tab**:
  - Interactive lineage graph
  - Upstream components (sources)
  - Downstream components (targets)
  - Relationship types (Read/Write)
  - Operation types

- **API Details Tab** (for Data APIs):
  - Endpoint information
  - HTTP methods
  - Postman collection (view/download)
  - Associated tables
  - Request/Response examples

- **Documentation Tab**:
  - Full description
  - Usage examples
  - Related documentation links

### 4. Lineage Visualization

#### Graph View
- **Node Types**:
  - Cassandra Table (blue)
  - YugabyteDB Table (green)
  - Data API (orange)
  - Kafka Topic (purple)
  - Spark Job (red)

- **Edge Types**:
  - Write relationship (solid arrow →)
  - Read relationship (dashed arrow ⇢)
  - Transform relationship (dotted arrow ⇉)

- **Interactive Features**:
  - Zoom in/out
  - Pan
  - Click node to view details
  - Hover for quick info
  - Expand/collapse nodes
  - Filter by relationship type

#### Lineage Path View
- Text-based path representation
- Example: `Kafka Topic → Spark Job → Cassandra Table ← Data API`

### 5. RAG Integration (Future)

#### Chat Interface
- **Location**: Side panel or modal
- **Features**:
  - Natural language queries
  - Context-aware responses
  - Component recommendations
  - Lineage explanations
  - Usage examples

#### Example Queries:
- "What tables does UserProfileAPI access?"
- "Show me all components that write to order_events table"
- "What is the data flow for order processing?"
- "Find all APIs in the E-Commerce domain"

## Implementation Phases

### Phase 1: Database Setup
- [x] Create database schema
- [x] Create all metadata tables
- [x] Insert example data
- [ ] Create indexes (including vector indexes if pgvector available)
- [ ] Set up data collection/ingestion pipeline

### Phase 2: Backend API
- [ ] Create REST API endpoints for:
  - Search (full-text + vector)
  - Component details
  - Lineage queries
  - Environment filtering
- [ ] Implement search functionality
- [ ] Implement lineage graph generation

### Phase 3: Frontend - Search
- [ ] Create Data Catalog tab
- [ ] Implement search bar with filters
- [ ] Create results list/grid view
- [ ] Implement component detail panels

### Phase 4: Frontend - Lineage
- [ ] Integrate graph visualization library (D3.js, Cytoscape, or similar)
- [ ] Create lineage graph component
- [ ] Implement interactive features
- [ ] Add lineage path view

### Phase 5: RAG Integration
- [ ] Set up embedding generation pipeline
- [ ] Implement vector search
- [ ] Create chat interface
- [ ] Integrate with LLM

## Query Examples

### Search Queries

```sql
-- Full-text search across all components
SELECT 
    c.*,
    ct.table_name as cassandra_table_name,
    da.api_name,
    kt.topic_name
FROM metadata.components c
LEFT JOIN metadata.cassandra_tables ct ON c.cassandra_table_id = ct.id
LEFT JOIN metadata.data_apis da ON c.data_api_id = da.id
LEFT JOIN metadata.kafka_topics kt ON c.kafka_topic_id = kt.id
WHERE c.search_vector @@ to_tsquery('user profile')
  AND c.environment_id = 1
ORDER BY c.name;

-- Search by component type
SELECT * FROM metadata.components
WHERE component_type = 'data_api'
  AND environment_id = 1
  AND search_vector @@ to_tsquery('order');
```

### Lineage Queries

```sql
-- Get all upstream components (sources)
SELECT 
    sc.name as source_component,
    sc.component_type as source_type,
    lr.relationship_type,
    lr.operation_type,
    tc.name as target_component,
    tc.component_type as target_type
FROM metadata.lineage_relationships lr
JOIN metadata.components sc ON lr.source_component_id = sc.id
JOIN metadata.components tc ON lr.target_component_id = tc.id
WHERE tc.id = (SELECT id FROM metadata.components WHERE name = 'order_events')
ORDER BY lr.relationship_type;

-- Get all downstream components (targets)
SELECT 
    sc.name as source_component,
    sc.component_type as source_type,
    lr.relationship_type,
    lr.operation_type,
    tc.name as target_component,
    tc.component_type as target_type
FROM metadata.lineage_relationships lr
JOIN metadata.components sc ON lr.source_component_id = sc.id
JOIN metadata.components tc ON lr.target_component_id = tc.id
WHERE sc.id = (SELECT id FROM metadata.components WHERE name = 'order-events-topic')
ORDER BY lr.relationship_type;

-- Get complete lineage for a component
WITH RECURSIVE lineage_path AS (
    -- Start with target component
    SELECT 
        tc.id as component_id,
        tc.name as component_name,
        tc.component_type,
        0 as depth,
        ARRAY[tc.id] as path
    FROM metadata.components tc
    WHERE tc.name = 'order_events'
    
    UNION ALL
    
    -- Find upstream components
    SELECT 
        sc.id,
        sc.name,
        sc.component_type,
        lp.depth + 1,
        lp.path || sc.id
    FROM lineage_path lp
    JOIN metadata.lineage_relationships lr ON lr.target_component_id = lp.component_id
    JOIN metadata.components sc ON lr.source_component_id = sc.id
    WHERE NOT sc.id = ANY(lp.path)  -- Prevent cycles
      AND lp.depth < 5  -- Limit depth
)
SELECT * FROM lineage_path ORDER BY depth, component_name;
```

### Vector Search Queries (RAG)

```sql
-- Semantic search using vector embeddings
SELECT 
    c.*,
    1 - (c.embedding <=> query_embedding) AS similarity
FROM metadata.components c
WHERE c.embedding <=> query_embedding < 0.3  -- Cosine distance threshold
  AND c.environment_id = 1
ORDER BY c.embedding <=> query_embedding
LIMIT 10;

-- Hybrid search (vector + metadata filters)
SELECT 
    c.*,
    1 - (c.embedding <=> query_embedding) AS similarity
FROM metadata.components c
WHERE c.embedding <=> query_embedding < 0.3
  AND c.environment_id = 1
  AND c.business_line = 'E-Commerce'
  AND c.search_vector @@ to_tsquery('order')
ORDER BY c.embedding <=> query_embedding
LIMIT 10;
```

## File Structure

```
ODP360/
├── metadata-schema.sql          # Database schema creation
├── metadata-example-data.sql    # Example data insertion
├── DATA_CATALOG_DESIGN.md      # This documentation file
└── backend-metadata/            # Backend API (to be created)
    └── src/main/java/...
└── frontend/src/components/
    └── DataCatalog/            # Frontend components (to be created)
        ├── DataCatalog.jsx
        ├── SearchBar.jsx
        ├── ComponentDetails.jsx
        └── LineageGraph.jsx
```

## Next Steps

1. **Execute SQL Scripts**: Run `metadata-schema.sql` and `metadata-example-data.sql` in YugabyteDB
2. **Verify Data**: Check that example data is inserted correctly
3. **Test Queries**: Run sample queries to verify functionality
4. **Backend Development**: Create REST API endpoints
5. **Frontend Development**: Build Data Catalog UI components
6. **Lineage Visualization**: Implement graph visualization
7. **RAG Integration**: Set up embedding generation and vector search

## Notes

- Vector embeddings are commented out in the schema until pgvector extension is verified in YugabyteDB
- All timestamps use `CURRENT_TIMESTAMP` for consistency
- Audit fields (`z_audit_*`) are included for compliance
- The `car_id` field provides cross-component linking capability
- JSONB fields (`metadata`) allow flexible storage of component-specific data

