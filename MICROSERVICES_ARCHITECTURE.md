# Microservices Architecture

## Overview

The ODP360 platform uses a **microservices architecture** with separate backend services for different data platforms.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│                  http://localhost:5173                   │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
               │                          │
    ┌──────────▼──────────┐    ┌──────────▼──────────┐
    │  Cassandra API      │    │   Kafka API         │
    │  Port: 8080         │    │   Port: 8081        │
    │  /api/clusters/*    │    │   /api/kafka/*      │
    └─────────────────────┘    └─────────────────────┘
```

## Services

### 1. Cassandra Browser API
- **Port**: 8080
- **Base Path**: `/api`
- **Location**: `backend-cassandra/`
- **Endpoints**:
  - `/api/clusters` - Cluster management
  - `/api/clusters/{id}/keyspaces` - Keyspace operations
  - `/api/clusters/{id}/keyspaces/{name}/tables` - Table operations
  - `/api/clusters/{id}/keyspaces/{name}/execute` - Query execution

### 2. Kafka Browser API
- **Port**: 8081
- **Base Path**: `/api`
- **Location**: `backend-kafka/`
- **Endpoints**:
  - `/api/kafka/clusters` - Cluster management
  - `/api/kafka/clusters/{id}/topics` - Topic operations
  - `/api/kafka/clusters/{id}/topics/{name}/consume` - Message consumption

## Benefits

1. **Independent Scaling**: Scale Cassandra and Kafka services independently based on load
2. **Team Ownership**: Different teams can own and deploy their services independently
3. **Technology Flexibility**: Each service can use different versions, libraries, or frameworks
4. **Fault Isolation**: If one service fails, others continue to work
5. **Resource Optimization**: Allocate resources based on each service's needs

## Running Services

### Development

**Terminal 1 - Cassandra API:**
```bash
cd backend-cassandra
./mvnw spring-boot:run
# Runs on http://localhost:8080
```

**Terminal 2 - Kafka API:**
```bash
cd backend-kafka
./mvnw spring-boot:run
# Runs on http://localhost:8081
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Production

Each service can be deployed independently:

```bash
# Build Cassandra API
cd backend-cassandra
./mvnw package
java -jar target/cassandra-browser-api-1.0.0.jar

# Build Kafka API
cd backend-kafka
./mvnw package
java -jar target/kafka-browser-api-1.0.0.jar
```

## Docker Compose

You can run both services with Docker Compose:

```yaml
version: '3.8'
services:
  cassandra-api:
    build: ./backend-cassandra
    ports:
      - "8080:8080"
  
  kafka-api:
    build: ./backend-kafka
    ports:
      - "8081:8081"
  
  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - cassandra-api
      - kafka-api
```

## Frontend Configuration

The frontend automatically detects API URLs:

- **Cassandra API**: `http://localhost:8080/api` (or auto-detected)
- **Kafka API**: `http://localhost:8081/api` (or auto-detected)

You can override with environment variables:
- `VITE_API_BASE_URL` - Cassandra API URL
- `VITE_KAFKA_API_BASE_URL` - Kafka API URL

## Migration from Monolith

If you're currently using the combined backend, you can:

1. **Keep both**: Run the old combined backend (port 8080) and new Kafka service (port 8081)
2. **Gradual migration**: Move Kafka endpoints to the new service
3. ✅ **Remove Kafka from Cassandra backend**: Kafka code has been moved to separate `backend-kafka/` service

## Next Steps

1. ✅ Separate Kafka backend created
2. ✅ Backend renamed to backend-cassandra for consistency
3. ⏳ Update deployment scripts
4. ⏳ Add service discovery (if needed)
5. ⏳ Add API gateway (optional, for unified entry point)

