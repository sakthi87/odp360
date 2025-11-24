-- =====================================================
-- ODP Metadata Database Schema
-- Database: odpmetadata
-- Schema: metadata
-- Purpose: Store metadata for Data Catalog with RAG support
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS metadata;

SET search_path TO metadata;

-- Enable pgvector extension (if available)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- Core Infrastructure Tables
-- =====================================================

-- Environments
CREATE TABLE metadata.environments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clusters
CREATE TABLE metadata.clusters (
    id SERIAL PRIMARY KEY,
    environment_id INTEGER REFERENCES metadata.environments(id),
    car_id VARCHAR(100),
    cluster_name VARCHAR(255) NOT NULL,
    hosted_location VARCHAR(255),
    hosted_rack VARCHAR(255),
    hosting_data_center VARCHAR(255),
    host_name VARCHAR(255),
    ip_address VARCHAR(50),
    hosting_zone VARCHAR(100),
    work_load_type VARCHAR(100),
    node_status_code VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servers
CREATE TABLE metadata.servers (
    id SERIAL PRIMARY KEY,
    cluster_id INTEGER REFERENCES metadata.clusters(id),
    available_storage BIGINT,
    available_trans_per_second INTEGER,
    curr_trans_per_second INTEGER,
    current_storage BIGINT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Cassandra Metadata Tables
-- =====================================================

-- Cassandra Keyspaces
CREATE TABLE metadata.cassandra_keyspaces (
    id SERIAL PRIMARY KEY,
    cluster_id INTEGER REFERENCES metadata.clusters(id),
    environment_id INTEGER REFERENCES metadata.environments(id),
    car_id VARCHAR(100),
    keyspace_name VARCHAR(255) NOT NULL,
    environment_value VARCHAR(50),
    replication_value TEXT,
    cluster_name VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cluster_id, keyspace_name)
);

-- Cassandra Tables
CREATE TABLE metadata.cassandra_tables (
    id SERIAL PRIMARY KEY,
    keyspace_id INTEGER REFERENCES metadata.cassandra_keyspaces(id),
    cluster_id INTEGER REFERENCES metadata.clusters(id),
    environment_id INTEGER REFERENCES metadata.environments(id),
    car_id VARCHAR(100),
    table_name VARCHAR(255) NOT NULL,
    keyspace_name VARCHAR(255) NOT NULL,
    business_line VARCHAR(100),
    product_line VARCHAR(100),
    system_of_origin_code VARCHAR(100),
    estimated_storage_volume BIGINT,
    actual_storage_volume BIGINT,
    estimated_tps INTEGER,
    actual_tps INTEGER,
    solr_realtime_flag BOOLEAN DEFAULT FALSE,
    description TEXT,
    metadata JSONB,
    -- Vector embedding for RAG (commented out if pgvector not available)
    -- description_embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(keyspace_id, table_name)
);

-- Cassandra Columns
CREATE TABLE metadata.cassandra_columns (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES metadata.cassandra_tables(id),
    column_name VARCHAR(255) NOT NULL,
    car_id VARCHAR(100),
    element_data_type VARCHAR(100),
    element_length INTEGER,
    field_order INTEGER,
    info_classification VARCHAR(100),
    classification VARCHAR(100),
    is_pci BOOLEAN DEFAULT FALSE,
    pre_applied_security TEXT,
    required BOOLEAN DEFAULT FALSE,
    sai_flag BOOLEAN DEFAULT FALSE,
    sasi_flag BOOLEAN DEFAULT FALSE,
    solr_case_flag BOOLEAN DEFAULT FALSE,
    solr_docval_flag BOOLEAN DEFAULT FALSE,
    solr_flag_index_flag BOOLEAN DEFAULT FALSE,
    solr_realtime_flag BOOLEAN DEFAULT FALSE,
    description TEXT,
    metadata JSONB,
    -- description_embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_id, column_name)
);

-- Cassandra Indexes
CREATE TABLE metadata.cassandra_indexes (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES metadata.cassandra_tables(id),
    index_name VARCHAR(255) NOT NULL,
    index_type VARCHAR(50),
    index_definition TEXT,
    columns TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- YugabyteDB Metadata Tables
-- =====================================================

-- YugabyteDB Databases
CREATE TABLE metadata.yugabyte_databases (
    id SERIAL PRIMARY KEY,
    cluster_id INTEGER REFERENCES metadata.clusters(id),
    environment_id INTEGER REFERENCES metadata.environments(id),
    car_id VARCHAR(100),
    database_name VARCHAR(255) NOT NULL,
    owner VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cluster_id, database_name)
);

-- YugabyteDB Tables
CREATE TABLE metadata.yugabyte_tables (
    id SERIAL PRIMARY KEY,
    database_id INTEGER REFERENCES metadata.yugabyte_databases(id),
    cluster_id INTEGER REFERENCES metadata.clusters(id),
    environment_id INTEGER REFERENCES metadata.environments(id),
    car_id VARCHAR(100),
    table_name VARCHAR(255) NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    business_line VARCHAR(100),
    product_line VARCHAR(100),
    system_of_origin_code VARCHAR(100),
    estimated_storage_volume BIGINT,
    actual_storage_volume BIGINT,
    estimated_tps INTEGER,
    actual_tps INTEGER,
    description TEXT,
    metadata JSONB,
    -- description_embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(database_id, table_name)
);

-- YugabyteDB Columns
CREATE TABLE metadata.yugabyte_columns (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES metadata.yugabyte_tables(id),
    column_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(100),
    is_nullable BOOLEAN,
    default_value TEXT,
    field_order INTEGER,
    info_classification VARCHAR(100),
    classification VARCHAR(100),
    is_pci BOOLEAN DEFAULT FALSE,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_id, column_name)
);

-- =====================================================
-- Data API Metadata Tables
-- =====================================================

-- Data APIs
CREATE TABLE metadata.data_apis (
    id SERIAL PRIMARY KEY,
    environment_id INTEGER REFERENCES metadata.environments(id),
    api_name VARCHAR(255) NOT NULL,
    api_description TEXT,
    api_operation_text TEXT,
    endpoint_name VARCHAR(500),
    endpoint_path VARCHAR(500),
    http_methods TEXT, -- Comma-separated list: GET,POST,PUT,DELETE
    cluster_name VARCHAR(255),
    keyspace_name VARCHAR(255),
    table_list_text TEXT,
    -- Postman collection
    postman_collection_text TEXT,
    postman_collection_json JSONB,
    -- Ownership fields
    data_owner_car_id VARCHAR(100),
    data_owner_car_name VARCHAR(255),
    owner_1_tech_name VARCHAR(255),
    owner_2_application_name VARCHAR(255),
    consumer_car_id VARCHAR(100),
    consumer_car_name VARCHAR(255),
    consumer_distribution_list_email_text TEXT,
    -- Domain/Subdomain
    domain VARCHAR(255),
    subdomain VARCHAR(255),
    -- Support & classification
    prod_support_assignment_group_name VARCHAR(255),
    system_table_classification_text VARCHAR(100),
    status_text VARCHAR(50),
    data_modeling_url VARCHAR(500),
    -- Audit fields
    load_ts TIMESTAMP,
    z_audit_created_by_text VARCHAR(255),
    z_audit_created_ts TIMESTAMP,
    z_audit_event_id VARCHAR(100),
    z_audit_last_modified_by_text VARCHAR(255),
    description TEXT,
    metadata JSONB,
    -- Vector embeddings for RAG (commented out if pgvector not available)
    -- api_doc_embedding vector(1536),
    -- description_embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(environment_id, api_name)
);

-- API to Table mapping
CREATE TABLE metadata.data_api_table_mappings (
    id SERIAL PRIMARY KEY,
    api_id INTEGER REFERENCES metadata.data_apis(id),
    table_name VARCHAR(255) NOT NULL,
    keyspace_name VARCHAR(255),
    relationship_type VARCHAR(50), -- 'read', 'write', 'read_write'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(api_id, table_name, keyspace_name)
);

-- =====================================================
-- Kafka Metadata Tables
-- =====================================================

-- Kafka Topics
CREATE TABLE metadata.kafka_topics (
    id SERIAL PRIMARY KEY,
    cluster_id INTEGER REFERENCES metadata.clusters(id),
    environment_id INTEGER REFERENCES metadata.environments(id),
    car_id VARCHAR(100),
    topic_name VARCHAR(255) NOT NULL,
    cluster_name VARCHAR(255),
    partition_count INTEGER,
    replication_factor INTEGER,
    business_line VARCHAR(100),
    product_line VARCHAR(100),
    system_of_origin_code VARCHAR(100),
    data_owner_car_id VARCHAR(100),
    data_owner_car_name VARCHAR(255),
    schema_registry_url VARCHAR(500),
    schema_name VARCHAR(255),
    description TEXT,
    metadata JSONB,
    -- description_embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cluster_id, topic_name)
);

-- =====================================================
-- Spark Metadata Tables
-- =====================================================

-- Spark Jobs
CREATE TABLE metadata.spark_jobs (
    id SERIAL PRIMARY KEY,
    environment_id INTEGER REFERENCES metadata.environments(id),
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50), -- 'batch', 'streaming'
    description TEXT,
    business_line VARCHAR(100),
    product_line VARCHAR(100),
    system_of_origin_code VARCHAR(100),
    data_owner_car_id VARCHAR(100),
    data_owner_car_name VARCHAR(255),
    owner_1_tech_name VARCHAR(255),
    spark_cluster_name VARCHAR(255),
    status_text VARCHAR(50),
    metadata JSONB,
    -- description_embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(environment_id, job_name)
);

-- =====================================================
-- Unified Components Table (for search and lineage)
-- =====================================================

-- Component Types Enum (for reference)
-- 'cassandra_table', 'cassandra_column', 'cassandra_keyspace',
-- 'yugabyte_table', 'yugabyte_column', 'yugabyte_database',
-- 'data_api', 'kafka_topic', 'spark_job'

-- Components
CREATE TABLE metadata.components (
    id SERIAL PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL,
    component_subtype VARCHAR(50),
    environment_id INTEGER REFERENCES metadata.environments(id),
    -- References to specific tables
    cassandra_table_id INTEGER REFERENCES metadata.cassandra_tables(id),
    cassandra_column_id INTEGER REFERENCES metadata.cassandra_columns(id),
    cassandra_keyspace_id INTEGER REFERENCES metadata.cassandra_keyspaces(id),
    yugabyte_table_id INTEGER REFERENCES metadata.yugabyte_tables(id),
    yugabyte_column_id INTEGER REFERENCES metadata.yugabyte_columns(id),
    data_api_id INTEGER REFERENCES metadata.data_apis(id),
    kafka_topic_id INTEGER REFERENCES metadata.kafka_topics(id),
    spark_job_id INTEGER REFERENCES metadata.spark_jobs(id),
    -- Searchable fields
    name VARCHAR(255) NOT NULL,
    fully_qualified_name VARCHAR(500),
    display_name VARCHAR(255),
    description TEXT,
    -- Common metadata
    car_id VARCHAR(100),
    business_line VARCHAR(100),
    product_line VARCHAR(100),
    system_of_origin_code VARCHAR(100),
    -- Full-text search vector
    search_vector tsvector,
    -- Vector embedding for RAG (commented out if pgvector not available)
    -- embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Lineage Relationships
-- =====================================================

-- Lineage Relationships
CREATE TABLE metadata.lineage_relationships (
    id SERIAL PRIMARY KEY,
    source_component_id INTEGER REFERENCES metadata.components(id) ON DELETE CASCADE,
    target_component_id INTEGER REFERENCES metadata.components(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'read', 'write', 'transform'
    operation_type VARCHAR(100), -- 'kafka_consume', 'spark_write', 'api_read', 'api_write', 'spark_read'
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_component_id, target_component_id, relationship_type, operation_type)
);

-- =====================================================
-- Indexes
-- =====================================================

-- Component indexes
CREATE INDEX idx_components_type_env ON metadata.components(component_type, environment_id);
CREATE INDEX idx_components_name ON metadata.components(name);
CREATE INDEX idx_components_fqn ON metadata.components(fully_qualified_name);
CREATE INDEX idx_components_search ON metadata.components USING GIN(search_vector);

-- Lineage indexes
CREATE INDEX idx_lineage_source ON metadata.lineage_relationships(source_component_id);
CREATE INDEX idx_lineage_target ON metadata.lineage_relationships(target_component_id);
CREATE INDEX idx_lineage_type ON metadata.lineage_relationships(relationship_type);

-- Cassandra indexes
CREATE INDEX idx_cassandra_tables_env ON metadata.cassandra_tables(environment_id);
CREATE INDEX idx_cassandra_tables_keyspace ON metadata.cassandra_tables(keyspace_name);

-- Data API indexes
CREATE INDEX idx_data_apis_env ON metadata.data_apis(environment_id);
CREATE INDEX idx_data_apis_name ON metadata.data_apis(api_name);

-- Kafka indexes
CREATE INDEX idx_kafka_topics_env ON metadata.kafka_topics(environment_id);

-- Spark indexes
CREATE INDEX idx_spark_jobs_env ON metadata.spark_jobs(environment_id);

-- Vector indexes (uncomment if pgvector is available)
-- CREATE INDEX idx_cassandra_tables_embedding ON metadata.cassandra_tables 
-- USING hnsw (description_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
-- CREATE INDEX idx_data_apis_embedding ON metadata.data_apis 
-- USING hnsw (api_doc_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
-- CREATE INDEX idx_components_embedding ON metadata.components 
-- USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

