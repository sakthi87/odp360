# Setting Up Cassandra for Local Testing

## Option 1: Docker (Recommended - Easiest)

### Quick Start with Docker

```bash
# Run Cassandra in Docker
docker run --name cassandra-test \
  -p 9042:9042 \
  -e CASSANDRA_CLUSTER_NAME=TestCluster \
  -e CASSANDRA_DC=datacenter1 \
  -e CASSANDRA_RACK=rack1 \
  -d cassandra:latest
```

### Verify it's running:
```bash
docker ps
# Should see cassandra-test container running
```

### Connection Details:
- **Host**: `localhost:9042`
- **Datacenter**: `datacenter1`
- **Username**: (none, unless you configure authentication)
- **Password**: (none)

### Create Sample Data (Optional):

```bash
# Connect to Cassandra
docker exec -it cassandra-test cqlsh

# In cqlsh, create sample keyspace and tables:
CREATE KEYSPACE profile_datastore WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE profile_datastore;

CREATE TABLE Customer (
    customer_id UUID PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE Customer_Address (
    address_id UUID PRIMARY KEY,
    customer_id UUID,
    street_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    is_primary BOOLEAN
);

CREATE TABLE Customer_Phone (
    phone_id UUID PRIMARY KEY,
    customer_id UUID,
    phone_number TEXT,
    phone_type TEXT,
    is_primary BOOLEAN,
    is_verified BOOLEAN
);

CREATE TABLE Customer_Email (
    email_id UUID PRIMARY KEY,
    customer_id UUID,
    email_address TEXT,
    is_primary BOOLEAN,
    is_verified BOOLEAN,
    verified_at TIMESTAMP
);

# Insert sample data
INSERT INTO Customer (customer_id, first_name, last_name, date_of_birth, created_at, updated_at) 
VALUES (uuid(), 'John', 'Doe', '1990-01-15', toTimestamp(now()), toTimestamp(now()));

# Repeat with more data...
```

### Stop Cassandra:
```bash
docker stop cassandra-test
docker rm cassandra-test
```

---

## Option 2: Docker Compose (Best for Development)

Create a `docker-compose-cassandra.yml` file:

```yaml
version: '3.8'

services:
  cassandra:
    image: cassandra:latest
    container_name: cassandra-test
    ports:
      - "9042:9042"
      - "7000:7000"
    environment:
      - CASSANDRA_CLUSTER_NAME=TestCluster
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_RACK=rack1
    volumes:
      - cassandra-data:/var/lib/cassandra
    healthcheck:
      test: ["CMD-SHELL", "nodetool status | grep -E '^UN'"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  cassandra-data:
```

Run it:
```bash
docker-compose -f docker-compose-cassandra.yml up -d
```

---

## Option 3: Local Installation (Mac/Linux)

### Mac (using Homebrew):
```bash
brew install cassandra

# Start Cassandra
brew services start cassandra

# Or run manually
cassandra -f
```

### Linux (Ubuntu/Debian):
```bash
# Add repository
echo "deb https://downloads.apache.org/cassandra/debian 40x main" | sudo tee -a /etc/apt/sources.list.d/cassandra.sources.list

# Install
sudo apt-get update
sudo apt-get install cassandra

# Start
sudo systemctl start cassandra
sudo systemctl enable cassandra
```

### Verify Installation:
```bash
# Check if running
nodetool status

# Or connect with cqlsh
cqlsh localhost 9042
```

---

## Option 4: Use Existing Cassandra Cluster

If you have access to a remote Cassandra cluster:
- Use the connection details in the UI
- Enter the host, port, and credentials
- Test connection before connecting

---

## Quick Test Script

After Cassandra is running, test the connection:

```bash
# Using cqlsh (if installed)
cqlsh localhost 9042

# Or using Docker
docker exec -it cassandra-test cqlsh

# Run a test query
SELECT cluster_name FROM system.local;
```

---

## Troubleshooting

### Port 9042 already in use:
```bash
# Find what's using the port
lsof -i :9042

# Kill the process or use a different port
```

### Cassandra won't start:
- Check Java version: `java -version` (needs Java 8 or 11)
- Check disk space
- Check logs: `docker logs cassandra-test`

### Connection timeout:
- Wait 30-60 seconds for Cassandra to fully start
- Check if container is running: `docker ps`
- Check logs: `docker logs cassandra-test`

---

## Recommended: Docker Option

For quick testing, use Docker - it's the fastest and cleanest option!

```bash
docker run --name cassandra-test -p 9042:9042 -d cassandra:latest
```

Wait 30 seconds, then connect via the UI!

