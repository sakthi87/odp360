# ODP360 Deployment Guide

This guide provides step-by-step instructions to deploy the ODP360 application in a new environment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Services](#backend-services)
4. [Frontend Deployment](#frontend-deployment)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Java 17+** - Required for all backend services
  ```bash
  java -version  # Should show version 17 or higher
  ```
- **Docker** - For running YugabyteDB (or use existing PostgreSQL/YugabyteDB instance)
  ```bash
  docker --version
  ```
- **Node.js 16+** (Optional - only if building frontend from source)
  ```bash
  node -v  # Should show version 16 or higher
  ```

### Port Requirements
Ensure the following ports are available:
- **5433** - YugabyteDB/PostgreSQL (Data Catalog metadata database)
- **8080** - Cassandra Browser API
- **8081** - Kafka Browser API
- **8082** - YugabyteDB YSQL Browser API
- **8083** - Data Catalog API
- **8084** - ODP Intake Service
- **5173** - Frontend (development) or **80/443** (production)

---

## Database Setup

### Option 1: Using Docker (YugabyteDB) - Recommended

1. **Start YugabyteDB container:**
   ```bash
   docker-compose -f docker-compose-yugabyte.yml up -d
   ```

2. **Wait for database to be ready** (about 30-60 seconds):
   ```bash
   docker ps | grep yugabyte
   ```

3. **Verify connection:**
   ```bash
   docker exec -it yugabyte psql -U yugabyte -d yugabyte -p 5433
   ```

4. **Create database and schema:**
   ```bash
   # Connect to YugabyteDB
   docker exec -it yugabyte psql -U yugabyte -d yugabyte -p 5433
   
   # Run the schema script
   \i /path/to/metadata-schema.sql
   # OR copy and paste the contents of metadata-schema.sql
   ```

   Or from your local machine:
   ```bash
   docker exec -i yugabyte psql -U yugabyte -d yugabyte -p 5433 < metadata-schema.sql
   ```

5. **Load example data (optional):**
   ```bash
   docker exec -i yugabyte psql -U yugabyte -d odpmetadata -p 5433 < metadata-example-data.sql
   ```

### Option 2: Using Existing PostgreSQL/YugabyteDB

1. **Create database:**
   ```sql
   CREATE DATABASE odpmetadata;
   ```

2. **Run schema script:**
   ```bash
   psql -h <host> -p <port> -U <username> -d odpmetadata -f metadata-schema.sql
   ```

3. **Update backend configuration** (see [Configuration](#configuration) section)

---

## Backend Services

### JAR Files Location

All backend JAR files are located in their respective `target/` directories:

```
backend-cassandra/target/cassandra-browser-api-1.0.0.jar
backend-datacatalog/target/datacatalog-api-1.0.0.jar
backend-intake/target/intake-service-1.0.0.jar
backend-kafka/target/kafka-browser-api-1.0.0.jar
backend-yugabyte-ysql/target/yugabyte-ysql-api-1.0.0.jar
```

### Running Backend Services

#### Method 1: Using Java directly (Recommended for production)

**Cassandra Browser API (Port 8080):**
```bash
java -jar backend-cassandra/target/cassandra-browser-api-1.0.0.jar
```

**Kafka Browser API (Port 8081):**
```bash
java -jar backend-kafka/target/kafka-browser-api-1.0.0.jar
```

**YugabyteDB YSQL Browser API (Port 8082):**
```bash
java -jar backend-yugabyte-ysql/target/yugabyte-ysql-api-1.0.0.jar
```

**Data Catalog API (Port 8083):**
```bash
java -jar backend-datacatalog/target/datacatalog-api-1.0.0.jar
```

**ODP Intake Service (Port 8084):**
```bash
java -jar backend-intake/target/intake-service-1.0.0.jar
```

#### Method 2: Using systemd (Linux) or launchd (macOS)

Create service files for each backend service. Example for systemd:

```ini
# /etc/systemd/system/datacatalog-api.service
[Unit]
Description=Data Catalog API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/ODP360/backend-datacatalog
ExecStart=/usr/bin/java -jar /path/to/ODP360/backend-datacatalog/target/datacatalog-api-1.0.0.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Method 3: Using Docker Compose (Optional)

You can create a `docker-compose-backend.yml` to run all services:

```yaml
version: '3.8'
services:
  datacatalog-api:
    image: openjdk:17-jre-slim
    volumes:
      - ./backend-datacatalog/target:/app
    working_dir: /app
    command: java -jar datacatalog-api-1.0.0.jar
    ports:
      - "8083:8083"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5433/odpmetadata?currentSchema=metadata
      - SPRING_DATASOURCE_USERNAME=yugabyte
      - SPRING_DATASOURCE_PASSWORD=yugabyte
    depends_on:
      - yugabyte
    # Repeat for other services...
```

### Running All Services in Background

**Linux/macOS:**
```bash
# Start all services in background
nohup java -jar backend-cassandra/target/cassandra-browser-api-1.0.0.jar > /tmp/cassandra-api.log 2>&1 &
nohup java -jar backend-kafka/target/kafka-browser-api-1.0.0.jar > /tmp/kafka-api.log 2>&1 &
nohup java -jar backend-yugabyte-ysql/target/yugabyte-ysql-api-1.0.0.jar > /tmp/yugabyte-api.log 2>&1 &
nohup java -jar backend-datacatalog/target/datacatalog-api-1.0.0.jar > /tmp/datacatalog-api.log 2>&1 &
nohup java -jar backend-intake/target/intake-service-1.0.0.jar > /tmp/intake-service.log 2>&1 &

# Check if services are running
ps aux | grep java

# View logs
tail -f /tmp/datacatalog-api.log
```

**Windows (PowerShell):**
```powershell
Start-Process java -ArgumentList "-jar", "backend-cassandra\target\cassandra-browser-api-1.0.0.jar" -WindowStyle Hidden
Start-Process java -ArgumentList "-jar", "backend-kafka\target\kafka-browser-api-1.0.0.jar" -WindowStyle Hidden
Start-Process java -ArgumentList "-jar", "backend-yugabyte-ysql\target\yugabyte-ysql-api-1.0.0.jar" -WindowStyle Hidden
Start-Process java -ArgumentList "-jar", "backend-datacatalog\target\datacatalog-api-1.0.0.jar" -WindowStyle Hidden
Start-Process java -ArgumentList "-jar", "backend-intake\target\intake-service-1.0.0.jar" -WindowStyle Hidden
```

---

## Frontend Deployment

### Option 1: Using Production Build (Recommended)

The frontend has been built and is available in `frontend/dist/` directory.

#### Using a Web Server (Nginx, Apache, etc.)

1. **Copy dist folder to web server:**
   ```bash
   cp -r frontend/dist/* /var/www/html/odp360/
   ```

2. **Nginx Configuration Example:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html/odp360;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api/ {
           proxy_pass http://localhost:8083/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

#### Using Python Simple HTTP Server (Quick Test)

```bash
cd frontend/dist
python3 -m http.server 8000
# Access at http://localhost:8000
```

#### Using Node.js serve

```bash
npm install -g serve
cd frontend/dist
serve -s . -l 8000
```

### Option 2: Development Mode

If you need to modify the frontend:

```bash
cd frontend
npm install  # First time only
npm run dev  # Runs on http://localhost:5173
```

**Note:** Update `frontend/src/config/api.js` if backend URLs are different.

---

## Configuration

### Backend Configuration Files

Each backend service has its own `application.properties` file. Update these based on your environment:

#### Data Catalog API (`backend-datacatalog/src/main/resources/application.properties`)

```properties
server.port=8083
spring.datasource.url=jdbc:postgresql://localhost:5433/odpmetadata?currentSchema=metadata
spring.datasource.username=yugabyte
spring.datasource.password=yugabyte
```

**To override at runtime:**
```bash
java -jar datacatalog-api-1.0.0.jar \
  --spring.datasource.url=jdbc:postgresql://your-host:5433/odpmetadata?currentSchema=metadata \
  --spring.datasource.username=your-user \
  --spring.datasource.password=your-password
```

#### ODP Intake Service (`backend-intake/src/main/resources/application.properties`)

```properties
server.port=8084
spring.datasource.url=jdbc:postgresql://localhost:5432/odpmetadata?currentSchema=metadata
spring.datasource.username=your-username
spring.datasource.password=your-password
```

#### Other Services

- **Cassandra Browser API**: Port 8080 (no database required)
- **Kafka Browser API**: Port 8081 (no database required)
- **YugabyteDB YSQL Browser API**: Port 8082 (no database required)

### Frontend Configuration

Update `frontend/src/config/api.js` if backend services are on different hosts/ports:

```javascript
const API_BASE_URLS = {
  datacatalog: 'http://localhost:8083',
  intake: 'http://localhost:8084',
  cassandra: 'http://localhost:8080',
  kafka: 'http://localhost:8081',
  yugabyte: 'http://localhost:8082'
}
```

**Note:** After changing configuration, rebuild the frontend:
```bash
cd frontend
npm run build
```

---

## Running the Application

### Quick Start (All Services)

1. **Start Database:**
   ```bash
   docker-compose -f docker-compose-yugabyte.yml up -d
   ```

2. **Initialize Database Schema:**
   ```bash
   docker exec -i yugabyte psql -U yugabyte -d yugabyte -p 5433 < metadata-schema.sql
   ```

3. **Start All Backend Services:**
   ```bash
   # In separate terminals or as background processes
   java -jar backend-cassandra/target/cassandra-browser-api-1.0.0.jar
   java -jar backend-kafka/target/kafka-browser-api-1.0.0.jar
   java -jar backend-yugabyte-ysql/target/yugabyte-ysql-api-1.0.0.jar
   java -jar backend-datacatalog/target/datacatalog-api-1.0.0.jar
   java -jar backend-intake/target/intake-service-1.0.0.jar
   ```

4. **Start Frontend:**
   ```bash
   # Option 1: Production build with web server
   cd frontend/dist && python3 -m http.server 8000
   
   # Option 2: Development mode
   cd frontend && npm run dev
   ```

5. **Access Application:**
   - Frontend: http://localhost:8000 (production) or http://localhost:5173 (development)
   - Data Catalog API: http://localhost:8083/api/environments
   - Intake API: http://localhost:8084/api/intake/list

### Verify Services are Running

```bash
# Check if services are listening on expected ports
curl http://localhost:8080/actuator/health  # Cassandra API
curl http://localhost:8081/actuator/health  # Kafka API
curl http://localhost:8082/actuator/health  # Yugabyte API
curl http://localhost:8083/api/environments  # Data Catalog API
curl http://localhost:8084/api/intake/list  # Intake API
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** Backend services cannot connect to database

**Solutions:**
1. Verify database is running:
   ```bash
   docker ps | grep yugabyte
   # OR
   psql -h localhost -p 5433 -U yugabyte -d odpmetadata
   ```

2. Check database credentials in `application.properties`

3. Verify database and schema exist:
   ```sql
   \l  -- List databases
   \dn  -- List schemas
   SELECT * FROM metadata.environments;  -- Test query
   ```

4. Check firewall/network settings

### Port Already in Use

**Problem:** `Address already in use` error

**Solutions:**
1. Find process using the port:
   ```bash
   # Linux/macOS
   lsof -i :8083
   # Windows
   netstat -ano | findstr :8083
   ```

2. Kill the process or change port in `application.properties`

### Frontend Cannot Connect to Backend

**Problem:** CORS errors or connection refused

**Solutions:**
1. Verify backend services are running (see [Verify Services](#verify-services-are-running))

2. Check `frontend/src/config/api.js` has correct URLs

3. Verify CORS settings in backend `application.properties`:
   ```properties
   spring.web.cors.allowed-origins=*
   ```

4. Check browser console for specific error messages

### JAR File Not Found

**Problem:** `java -jar` command fails with "file not found"

**Solutions:**
1. Verify JAR files exist:
   ```bash
   ls -la backend-*/target/*.jar
   ```

2. Rebuild if needed:
   ```bash
   cd backend-datacatalog && mvn clean package -DskipTests
   ```

### Frontend Build Fails

**Problem:** `npm run build` fails

**Solutions:**
1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. Check for missing dependencies in `package.json`

### Services Start But Return Errors

**Problem:** Services start but API calls fail

**Solutions:**
1. Check service logs:
   ```bash
   tail -f /tmp/datacatalog-api.log
   ```

2. Verify database schema is initialized:
   ```sql
   SELECT COUNT(*) FROM metadata.environments;
   ```

3. Check application.properties for correct configuration

---

## File Structure Summary

```
ODP360/
├── backend-cassandra/
│   └── target/
│       └── cassandra-browser-api-1.0.0.jar
├── backend-datacatalog/
│   └── target/
│       └── datacatalog-api-1.0.0.jar
├── backend-intake/
│   └── target/
│       └── intake-service-1.0.0.jar
├── backend-kafka/
│   └── target/
│       └── kafka-browser-api-1.0.0.jar
├── backend-yugabyte-ysql/
│   └── target/
│       └── yugabyte-ysql-api-1.0.0.jar
├── frontend/
│   └── dist/          # Production build (ready to deploy)
├── metadata-schema.sql
├── metadata-example-data.sql
├── docker-compose-yugabyte.yml
└── DEPLOYMENT_GUIDE.md (this file)
```

---

## Next Steps

1. **Initialize Data Catalog:**
   - Load example data: `metadata-example-data.sql`
   - Or start adding your own metadata through the UI

2. **Configure Connections:**
   - Add Cassandra cluster connections via UI
   - Add Kafka broker connections via UI
   - Add YugabyteDB connections via UI

3. **Set Up Monitoring:**
   - Consider adding health check endpoints
   - Set up log aggregation
   - Monitor service uptime

4. **Production Considerations:**
   - Use reverse proxy (Nginx/Apache) for frontend
   - Set up SSL/TLS certificates
   - Configure firewall rules
   - Set up automated backups for database
   - Use process managers (systemd, PM2, etc.)
   - Configure log rotation

---

## Support

For issues or questions:
1. Check service logs
2. Verify all prerequisites are met
3. Review configuration files
4. Check database connectivity and schema

---

**Last Updated:** December 2024

