#!/bin/bash

# Script to set up DSE 5.1.33 with Solr and sample data

echo "Waiting for DSE to be ready (90 seconds for DSE Search to initialize)..."
sleep 90

echo "Checking DSE Search status..."
docker exec -i dse-5.1.33 dsetool status 2>&1 | head -10

echo ""
echo "Creating sample keyspace and tables with Solr indexes..."

# Create keyspace
docker exec -i dse-5.1.33 cqlsh <<EOF
CREATE KEYSPACE IF NOT EXISTS profile_datastore 
WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1': 1};

USE profile_datastore;

-- Create table
CREATE TABLE IF NOT EXISTS Customer (
    customer_id UUID PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Insert sample data
INSERT INTO Customer (customer_id, first_name, last_name, email, date_of_birth, created_at, updated_at) 
VALUES (550e8400-e29b-41d4-a716-446655440001, 'John', 'Smith', 'john.smith@example.com', '1985-05-15', toTimestamp(now()), toTimestamp(now()));

INSERT INTO Customer (customer_id, first_name, last_name, email, date_of_birth, created_at, updated_at) 
VALUES (550e8400-e29b-41d4-a716-446655440002, 'Jane', 'Johnson', 'jane.johnson@example.com', '1990-08-22', toTimestamp(now()), toTimestamp(now()));

INSERT INTO Customer (customer_id, first_name, last_name, email, date_of_birth, created_at, updated_at) 
VALUES (550e8400-e29b-41d4-a716-446655440003, 'Michael', 'Williams', 'michael.williams@example.com', '1988-12-10', toTimestamp(now()), toTimestamp(now()));
EOF

echo ""
echo "Creating Solr search index for Customer table..."
docker exec -i dse-5.1.33 dsetool create_core profile_datastore.Customer generateResources=true reindex=true

echo ""
echo "Verifying Solr index..."
docker exec -i dse-5.1.33 dsetool list_cores

echo ""
echo "Checking dse_search keyspace..."
docker exec -i dse-5.1.33 cqlsh <<EOF
SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'dse_search';
DESCRIBE dse_search.solr_resources;
SELECT * FROM dse_search.solr_resources LIMIT 5;
EOF

echo ""
echo "✅ DSE with Solr setup complete!"
echo "You can now connect to:"
echo "  - CQL: localhost:9042"
echo "  - Solr: http://localhost:8983/solr"

