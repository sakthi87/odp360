# Deployment Artifacts Reference

This file lists all the built artifacts ready for deployment.

## Backend JAR Files

All backend services are packaged as standalone JAR files (includes all dependencies):

| Service | JAR File | Size | Port | Description |
|---------|----------|------|------|-------------|
| **Cassandra Browser API** | `backend-cassandra/target/cassandra-browser-api-1.0.0.jar` | 46 MB | 8080 | Browse Cassandra clusters, keyspaces, tables |
| **Kafka Browser API** | `backend-kafka/target/kafka-browser-api-1.0.0.jar` | 34 MB | 8081 | Browse Kafka topics and messages |
| **YugabyteDB YSQL Browser API** | `backend-yugabyte-ysql/target/yugabyte-ysql-api-1.0.0.jar` | 23 MB | 8082 | Browse YugabyteDB databases and tables |
| **Data Catalog API** | `backend-datacatalog/target/datacatalog-api-1.0.0.jar` | 22 MB | 8083 | Data Catalog metadata API |
| **ODP Intake Service** | `backend-intake/target/intake-service-1.0.0.jar` | 34 MB | 8084 | Intake form processing and table creation |

### Running a JAR File

```bash
java -jar <path-to-jar-file>
```

Example:
```bash
java -jar backend-datacatalog/target/datacatalog-api-1.0.0.jar
```

### Override Configuration

You can override configuration at runtime:

```bash
java -jar datacatalog-api-1.0.0.jar \
  --server.port=8083 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/odpmetadata?currentSchema=metadata \
  --spring.datasource.username=yugabyte \
  --spring.datasource.password=yugabyte
```

---

## Frontend Production Build

**Location:** `frontend/dist/`

The frontend has been built for production and is ready to deploy to any web server.

### Contents

- `index.html` - Main HTML file
- `assets/` - JavaScript, CSS, and image files

### Deployment Options

1. **Static Web Server** (Nginx, Apache, etc.)
   ```bash
   cp -r frontend/dist/* /var/www/html/odp360/
   ```

2. **Python HTTP Server** (Quick test)
   ```bash
   cd frontend/dist
   python3 -m http.server 8000
   ```

3. **Node.js serve**
   ```bash
   npm install -g serve
   cd frontend/dist
   serve -s . -l 8000
   ```

---

## Database Files

| File | Description |
|------|-------------|
| `metadata-schema.sql` | Database schema for Data Catalog metadata |
| `metadata-example-data.sql` | Example data for testing (optional) |
| `docker-compose-yugabyte.yml` | Docker Compose file for YugabyteDB |

---

## Quick Start Commands

### 1. Start Database
```bash
docker-compose -f docker-compose-yugabyte.yml up -d
```

### 2. Initialize Schema
```bash
docker exec -i yugabyte psql -U yugabyte -d yugabyte -p 5433 < metadata-schema.sql
```

### 3. Start All Backend Services
```bash
# Terminal 1
java -jar backend-cassandra/target/cassandra-browser-api-1.0.0.jar

# Terminal 2
java -jar backend-kafka/target/kafka-browser-api-1.0.0.jar

# Terminal 3
java -jar backend-yugabyte-ysql/target/yugabyte-ysql-api-1.0.0.jar

# Terminal 4
java -jar backend-datacatalog/target/datacatalog-api-1.0.0.jar

# Terminal 5
java -jar backend-intake/target/intake-service-1.0.0.jar
```

### 4. Start Frontend
```bash
cd frontend/dist
python3 -m http.server 8000
```

### 5. Access Application
- Frontend: http://localhost:8000
- Data Catalog API: http://localhost:8083/api/environments

---

## File Sizes Summary

- **Total Backend JARs:** ~159 MB
- **Frontend Build:** ~3 MB (compressed)

---

## Prerequisites

- Java 17+ (for backend services)
- Docker (for YugabyteDB, optional)
- Web server (for frontend, or use Python/Node.js for testing)

---

## See Also

- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `SETUP_STEPS.md` - Development setup steps

---

**Last Updated:** December 2024

