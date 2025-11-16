# Quick DSE 5.1.33 Setup with Solr

## Prerequisites
- Docker Desktop running
- At least 4GB RAM available (DSE needs more than regular Cassandra)
- Ports 9042, 8983, 7000, 7001 available

## Quick Start

### Step 1: Stop Current Cassandra (if running)
```bash
docker stop cassandra-test
# Keep it for now, or remove: docker rm cassandra-test
```

### Step 2: Start DSE with Solr
```bash
docker-compose -f docker-compose-dse.yml up -d
```

### Step 3: Wait for DSE to Initialize
DSE takes longer to start than regular Cassandra (60-90 seconds). Check logs:
```bash
docker logs -f dse-5.1.33
```

Wait until you see: "Starting listening for CQL clients" and "DSE Search initialized"

### Step 4: Run Setup Script
```bash
./scripts/setup-dse-solr.sh
```

This will:
- Create sample keyspace and tables
- Create Solr search index
- Verify setup

### Step 5: Verify Setup
```bash
# Check Solr cores
docker exec -it dse-5.1.33 dsetool list_cores

# Check dse_search keyspace
docker exec -it dse-5.1.33 cqlsh -e "SELECT * FROM dse_search.solr_resources;"
```

### Step 6: Connect in Your App
- Host: `localhost:9042`
- Datacenter: `datacenter1`
- Username/Password: (leave empty)

## What You'll See

After connecting and selecting the `Customer` table:
- **CQL Indexes**: (if any exist)
- **Solr Indexes**: `profile_datastore.Customer` with orange SOLR badge

## Troubleshooting

### Container won't start
- Check Docker has enough resources (4GB+ RAM)
- Check ports aren't in use: `lsof -i :9042 -i :8983`

### Solr not enabled
- Verify environment variable: `docker exec dse-5.1.33 env | grep SOLR`
- Should show: `SOLR_ENABLED=1`

### Can't access Solr
- Solr Admin UI: http://localhost:8983/solr
- If not accessible, wait longer (DSE Search takes time to initialize)

## Stop DSE
```bash
docker-compose -f docker-compose-dse.yml down
```

## Switch Back to Regular Cassandra
```bash
docker start cassandra-test
# Or: docker run --name cassandra-test -p 9042:9042 -d cassandra:latest
```
