# Setting Up DSE 5.1.33 with Solr Locally

## Important Notes

⚠️ **DataStax Enterprise (DSE) requires a license**. However, you can:
- Use the evaluation/trial version for testing
- The Docker image accepts the license with `DS_LICENSE=accept`
- For production, you'll need a valid DSE license

## Option 1: Docker Compose (Recommended)

### Quick Start

```bash
# Start DSE with Solr enabled
docker-compose -f docker-compose-dse.yml up -d

# Wait for DSE to start (60-90 seconds)
# Then run setup script
./scripts/setup-dse-solr.sh
```

### What It Does:
1. Starts DSE 5.1.33 container
2. Enables DSE Search (Solr) with `SEARCH_ENABLED=1`
3. Sets up sample data
4. Creates Solr search index

### Connection Details:
- **CQL**: `localhost:9042`
- **Solr Admin**: `http://localhost:8983/solr`
- **Datacenter**: `datacenter1`

## Option 2: Manual Docker Setup

### Step 1: Pull and Run DSE Image

```bash
docker pull datastax/dse-server:5.1.33

docker run --name dse-5.1.33 \
  -p 9042:9042 \
  -p 8983:8983 \
  -e DS_LICENSE=accept \
  -e SEARCH_ENABLED=1 \
  -e DSE_AUTH=allow_all \
  -e CLUSTER_NAME=TestDSECluster \
  -d datastax/dse-server:5.1.33
```

### Step 2: Wait for DSE to Start

```bash
# Check logs
docker logs -f dse-5.1.33

# Wait until you see: "Starting listening for CQL clients"
# This takes 60-90 seconds
```

### Step 3: Verify DSE Search is Enabled

```bash
docker exec -it dse-5.1.33 dsetool status
```

You should see DSE Search in the output.

### Step 4: Create Sample Data

```bash
docker exec -it dse-5.1.33 cqlsh
```

Then in cqlsh:
```sql
CREATE KEYSPACE profile_datastore 
WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1': 1};

USE profile_datastore;

CREATE TABLE Customer (
    customer_id UUID PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

INSERT INTO Customer (customer_id, first_name, last_name, email, date_of_birth, created_at, updated_at) 
VALUES (550e8400-e29b-41d4-a716-446655440001, 'John', 'Smith', 'john.smith@example.com', '1985-05-15', toTimestamp(now()), toTimestamp(now()));
```

### Step 5: Create Solr Search Index

```bash
# Create Solr core for Customer table
docker exec -it dse-5.1.33 dsetool create_core profile_datastore.Customer generateResources=true reindex=true
```

### Step 6: Verify Solr Index

```bash
# List all Solr cores
docker exec -it dse-5.1.33 dsetool list_cores

# Check dse_search keyspace
docker exec -it dse-5.1.33 cqlsh -e "SELECT * FROM dse_search.solr_resources;"
```

## Option 3: Using Existing DSE Installation

If you already have DSE 5.1.33 installed locally:

### Enable DSE Search

Edit `dse.yaml`:
```yaml
search_enabled: true
```

Restart DSE:
```bash
sudo service dse restart
```

## Verification Steps

### 1. Check DSE Search is Enabled

```bash
docker exec -it dse-5.1.33 dsetool status
```

Look for "DSE Search" in the output.

### 2. Check dse_search Keyspace Exists

```bash
docker exec -it dse-5.1.33 cqlsh -e "SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'dse_search';"
```

Should return: `dse_search`

### 3. Check Solr Resources Table

```bash
docker exec -it dse-5.1.33 cqlsh -e "DESCRIBE dse_search.solr_resources;"
```

Should show the table structure.

### 4. List Solr Cores

```bash
docker exec -it dse-5.1.33 dsetool list_cores
```

Should show: `profile_datastore.Customer` (or similar)

### 5. Check Solr Admin UI

Open browser: `http://localhost:8983/solr`

You should see the Solr admin interface.

## Testing with Your Application

### 1. Connect to DSE

In your application:
- **Host**: `localhost:9042`
- **Datacenter**: `datacenter1`
- **Username**: (leave empty, or use default)
- **Password**: (leave empty, or use default)

### 2. Select Customer Table

When you select the `Customer` table, you should see:
- **CQL Indexes**: (if any secondary indexes exist)
- **Solr Indexes**: `profile_datastore.Customer` with SOLR badge

### 3. Verify Index Display

The right panel should show:
- Index Name: `profile_datastore.Customer` (or similar)
- Index Type: SOLR (with orange badge)
- Details: resource and config information

## Troubleshooting

### DSE Container Won't Start

```bash
# Check logs
docker logs dse-5.1.33

# Common issues:
# - Port conflicts (9042, 8983 already in use)
# - Insufficient memory (DSE needs at least 2GB)
# - License issues
```

### Solr Not Enabled

```bash
# Check if SEARCH_ENABLED is set
docker exec -it dse-5.1.33 env | grep SEARCH

# Restart with SEARCH_ENABLED=1
docker stop dse-5.1.33
docker rm dse-5.1.33
# Run again with SEARCH_ENABLED=1
```

### Can't Create Solr Core

```bash
# Check DSE Search status
docker exec -it dse-5.1.33 dsetool status

# Verify keyspace exists
docker exec -it dse-5.1.33 cqlsh -e "DESCRIBE KEYSPACE profile_datastore;"

# Try creating core again
docker exec -it dse-5.1.33 dsetool create_core profile_datastore.Customer generateResources=true reindex=true
```

### dse_search Keyspace Not Found

If `dse_search` keyspace doesn't exist:
- DSE Search is not enabled
- Restart container with `SEARCH_ENABLED=1`
- Wait for DSE to fully initialize (can take 2-3 minutes)

## Alternative: Use Regular Cassandra + Mock Solr Data

If DSE Docker setup is problematic, we can:
1. Keep using regular Cassandra
2. Create mock `dse_search.solr_resources` table structure
3. Insert test data to verify the UI

Let me know if you'd prefer this approach!

## Next Steps

1. **Start DSE**: `docker-compose -f docker-compose-dse.yml up -d`
2. **Wait 60-90 seconds** for DSE to initialize
3. **Run setup script**: `./scripts/setup-dse-solr.sh`
4. **Connect in your app**: Use `localhost:9042`
5. **Test**: Select a table and verify Solr indexes appear

## Resources

- DSE Docker Hub: https://hub.docker.com/r/datastax/dse-server
- DSE Search Documentation: https://docs.datastax.com/en/dse/5.1/dse-dev/datastax_enterprise/search/searchTOC.html

