-- ODP Intake Metadata Schema
-- This schema stores intake form submissions including project details, Cassandra entities, and API details

-- Project Details Table
CREATE TABLE IF NOT EXISTS metadata.intake_projects (
    intake_id VARCHAR(255) PRIMARY KEY,
    edai_req_id VARCHAR(255),
    fund_type VARCHAR(50),
    fund_value VARCHAR(255),
    business_line VARCHAR(255),
    sub_domain VARCHAR(255),
    domain VARCHAR(255),
    project_name VARCHAR(255),
    project_description TEXT,
    tech_owner_email VARCHAR(255),
    developer_email VARCHAR(255),
    exp_dev_date DATE,
    exp_it_date DATE,
    uat_date DATE,
    prod_date DATE,
    components VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cassandra Entities Table
CREATE TABLE IF NOT EXISTS metadata.intake_cassandra_entities (
    id BIGSERIAL PRIMARY KEY,
    intake_id VARCHAR(255) NOT NULL REFERENCES metadata.intake_projects(intake_id) ON DELETE CASCADE,
    entity_name VARCHAR(255) NOT NULL,
    entity_description TEXT,
    sor_of_data VARCHAR(255),
    retention VARCHAR(255),
    total_record BIGINT,
    record_size_bytes BIGINT,
    volume_gb_current_yr DECIMAL(15,2),
    volume_gb_5_years DECIMAL(15,2),
    keyspace VARCHAR(255),
    csv_schema JSONB, -- Stores CSV fields as JSON
    field_attributes JSONB, -- Stores field metadata (cardinality, business key, etc.)
    access_patterns JSONB, -- Stores access patterns as JSON
    constraints_settings JSONB, -- Stores constraint settings
    generated_cql TEXT, -- Stores the generated CREATE TABLE CQL
    partition_key JSONB, -- Stores partition key array
    clustering_keys JSONB, -- Stores clustering keys array
    indexes JSONB, -- Stores indexes array
    warnings JSONB, -- Stores warnings array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Details Table
CREATE TABLE IF NOT EXISTS metadata.intake_api_details (
    id BIGSERIAL PRIMARY KEY,
    intake_id VARCHAR(255) NOT NULL REFERENCES metadata.intake_projects(intake_id) ON DELETE CASCADE,
    entity_id BIGINT REFERENCES metadata.intake_cassandra_entities(id) ON DELETE CASCADE, -- NULL for manual entries
    pattern_id VARCHAR(255), -- Links to access pattern if from Cassandra entity
    access_pattern VARCHAR(255) NOT NULL,
    description TEXT,
    average_tps INTEGER,
    peak_tps INTEGER,
    sla_in_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_intake_projects_edai_req_id ON metadata.intake_projects(edai_req_id);
CREATE INDEX IF NOT EXISTS idx_intake_projects_project_name ON metadata.intake_projects(project_name);
CREATE INDEX IF NOT EXISTS idx_intake_cassandra_entities_intake_id ON metadata.intake_cassandra_entities(intake_id);
CREATE INDEX IF NOT EXISTS idx_intake_cassandra_entities_entity_name ON metadata.intake_cassandra_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_intake_api_details_intake_id ON metadata.intake_api_details(intake_id);
CREATE INDEX IF NOT EXISTS idx_intake_api_details_entity_id ON metadata.intake_api_details(entity_id);

