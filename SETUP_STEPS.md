# Setup Steps - Connect to Your DSE Environment

## Prerequisites

Before starting, ensure you have:
- **Java 17+** installed (`java -version`)
- **Node.js 16+** installed (`node -v`)
- **Maven** (or use `./mvnw` wrapper included)
- **DSE/Cassandra cluster** accessible (or use local Docker setup)

## 1. Start Backend

**Cassandra API:**
```bash
cd backend-cassandra
./mvnw spring-boot:run
```
Cassandra API runs on `http://localhost:8080`

**Kafka API (optional):**
```bash
cd backend-kafka
./mvnw spring-boot:run
```
Kafka API runs on `http://localhost:8081`

## 2. Start Frontend
```bash
cd frontend
npm install  # First time only - installs dependencies
npm run dev
```
Frontend runs on `http://localhost:5173`

## 3. Open Application
Open browser: `http://localhost:5173`

**Note:** The app opens on the "Data Catalog" tab by default. Click on the **"C* Query"** tab to access the Cassandra browser.

## 4. Add Connection
In the **"C* Query"** tab, click **"+ Add Connection"** button

## 5. Enter DSE Connection Details
- **Host(s)**: `your-dse-host:9042` (comma-separated if multiple)
- **Datacenter**: `your-datacenter-name` (e.g., `datacenter1`)
- **Username**: (your DSE username, if required)
- **Password**: (your DSE password, if required)
- **Connection Name**: (optional, e.g., "Production DSE")

## 6. Test Connection
Click **"Test Connection"** - should show success

## 7. Connect
Click **"Connect"** - cluster appears in left panel

## 8. Browse Data
- Expand cluster → see keyspaces
- Expand keyspace → see tables
- Click table → see details, indexes, and records

## 9. Verify Solr Indexes
If DSE Search is enabled:
- Select a table with Solr index
- Right panel shows indexes with **SOLR** badge (orange)

## 10. Test Query Execution
- Modify query in center panel
- Click **"Execute"** or press **Ctrl+Enter**
- Results appear in bottom panel

## Troubleshooting

**Connection fails?**
- Check host/port are correct
- Verify network access to DSE cluster
- Check firewall rules

**No Solr indexes showing?**
- Verify DSE Search is enabled in your cluster
- Check `dse_search` keyspace exists: `SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'dse_search';`

**Backend errors?**
- Check backend logs in terminal
- Verify Java 17+ is installed: `java -version`

