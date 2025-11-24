#!/bin/bash

# Setup script for ODP Metadata Database
# This script creates the database, schema, and loads example data

set -e

echo "=========================================="
echo "ODP Metadata Database Setup"
echo "=========================================="

# Database configuration
DB_NAME="odpmetadata"
SCHEMA_NAME="metadata"
HOST="localhost"
PORT="5433"
USER="yugabyte"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating database '${DB_NAME}'...${NC}"
docker exec yugabyte bash -c "cd /home/yugabyte && bin/ysqlsh -h localhost -p 5433 -U ${USER} -d yugabyte -c 'CREATE DATABASE ${DB_NAME};'" 2>&1 || {
    echo -e "${YELLOW}Database might already exist, continuing...${NC}"
}

echo -e "${GREEN}✓ Database created${NC}"

echo -e "${YELLOW}Step 2: Creating schema and tables...${NC}"
docker exec -i yugabyte bash -c "cd /home/yugabyte && bin/ysqlsh -h localhost -p 5433 -U ${USER} -d ${DB_NAME}" < metadata-schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema and tables created${NC}"
else
    echo -e "${RED}✗ Failed to create schema${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Loading example data...${NC}"
docker exec -i yugabyte bash -c "cd /home/yugabyte && bin/ysqlsh -h localhost -p 5433 -U ${USER} -d ${DB_NAME}" < metadata-example-data.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Example data loaded${NC}"
else
    echo -e "${RED}✗ Failed to load example data${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 4: Verifying data...${NC}"
docker exec yugabyte bash -c "cd /home/yugabyte && bin/ysqlsh -h localhost -p 5433 -U ${USER} -d ${DB_NAME} -c \"SELECT COUNT(*) as environment_count FROM metadata.environments; SELECT COUNT(*) as component_count FROM metadata.components; SELECT COUNT(*) as lineage_count FROM metadata.lineage_relationships;\"" 2>&1

echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Database: ${DB_NAME}"
echo "Schema: ${SCHEMA_NAME}"
echo ""
echo "You can now:"
echo "1. Query the metadata tables"
echo "2. Test the search functionality"
echo "3. View lineage relationships"
echo ""
echo "Example query:"
echo "  SELECT * FROM metadata.components WHERE environment_id = 1;"
echo ""

