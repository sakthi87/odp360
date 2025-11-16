#!/bin/bash

# Script to set up Cassandra with sample data for testing

echo "Starting Cassandra container..."
docker run --name cassandra-test \
  -p 9042:9042 \
  -e CASSANDRA_CLUSTER_NAME=TestCluster \
  -e CASSANDRA_DC=datacenter1 \
  -e CASSANDRA_RACK=rack1 \
  -d cassandra:latest

echo "Waiting for Cassandra to start (30 seconds)..."
sleep 30

echo "Creating sample keyspace and tables..."
docker exec -i cassandra-test cqlsh <<EOF
CREATE KEYSPACE IF NOT EXISTS profile_datastore 
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE profile_datastore;

CREATE TABLE IF NOT EXISTS Customer (
    customer_id UUID PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Customer_Address (
    address_id UUID PRIMARY KEY,
    customer_id UUID,
    street_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    is_primary BOOLEAN
);

CREATE TABLE IF NOT EXISTS Customer_Phone (
    phone_id UUID PRIMARY KEY,
    customer_id UUID,
    phone_number TEXT,
    phone_type TEXT,
    is_primary BOOLEAN,
    is_verified BOOLEAN
);

CREATE TABLE IF NOT EXISTS Customer_Email (
    email_id UUID PRIMARY KEY,
    customer_id UUID,
    email_address TEXT,
    is_primary BOOLEAN,
    is_verified BOOLEAN,
    verified_at TIMESTAMP
);
EOF

echo "Inserting sample data..."
docker exec -i cassandra-test cqlsh <<EOF
USE profile_datastore;

INSERT INTO Customer (customer_id, first_name, last_name, date_of_birth, created_at, updated_at) 
VALUES (550e8400-e29b-41d4-a716-446655440001, 'John', 'Smith', '1985-05-15', toTimestamp(now()), toTimestamp(now()));

INSERT INTO Customer (customer_id, first_name, last_name, date_of_birth, created_at, updated_at) 
VALUES (550e8400-e29b-41d4-a716-446655440002, 'Jane', 'Johnson', '1990-08-22', toTimestamp(now()), toTimestamp(now()));

INSERT INTO Customer (customer_id, first_name, last_name, date_of_birth, created_at, updated_at) 
VALUES (550e8400-e29b-41d4-a716-446655440003, 'Michael', 'Williams', '1988-12-10', toTimestamp(now()), toTimestamp(now()));

INSERT INTO Customer_Address (address_id, customer_id, street_address, city, state, zip_code, country, is_primary) 
VALUES (660e8400-e29b-41d4-a716-446655440001, 550e8400-e29b-41d4-a716-446655440001, '101 Main Street', 'New York', 'NY', '10001', 'USA', true);

INSERT INTO Customer_Phone (phone_id, customer_id, phone_number, phone_type, is_primary, is_verified) 
VALUES (770e8400-e29b-41d4-a716-446655440001, 550e8400-e29b-41d4-a716-446655440001, '+1-555-0101-1001', 'Mobile', true, true);

INSERT INTO Customer_Email (email_id, customer_id, email_address, is_primary, is_verified, verified_at) 
VALUES (880e8400-e29b-41d4-a716-446655440001, 550e8400-e29b-41d4-a716-446655440001, 'john.smith@example.com', true, true, toTimestamp(now()));
EOF

echo ""
echo "✅ Cassandra is ready!"
echo "Connection details:"
echo "  Host: localhost:9042"
echo "  Datacenter: datacenter1"
echo ""
echo "You can now connect via the UI!"

