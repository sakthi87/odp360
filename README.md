# Cassandra Browser - Monorepo

A complete monorepo application for browsing and querying Cassandra databases with a React frontend and Spring Boot backend.

## Project Structure

```
ODP360/
├── frontend/              # React UI application
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Spring Boot API
│   ├── src/
│   └── pom.xml
│
└── README.md
```

## Features

- **Dynamic Connection Management**: Add Cassandra clusters via UI
- **Tree Navigation**: Browse Clusters → Keyspaces → Tables
- **Table Details**: View schema, columns, and indexes
- **Query Builder**: Auto-generate and execute CQL queries
- **Results Display**: View query results in table format
- **Resizable Panels**: Drag to adjust panel sizes

## Prerequisites

- **Node.js** (v16 or higher)
- **Java 17** or higher
- **Maven** 3.6+
- **Docker** (optional, for running Cassandra locally)
- **Cassandra Cluster** (or use Docker - see below)

## Quick Start

### 0. Set Up Cassandra (If not already running)

**Option A: Docker (Recommended - Easiest)**
```bash
# Start Cassandra in Docker
docker run --name cassandra-test -p 9042:9042 -d cassandra:latest

# Wait 30 seconds for Cassandra to start, then continue
```

**Option B: Use Setup Script**
```bash
# Run the setup script (creates Cassandra + sample data)
./scripts/setup-cassandra.sh
```

**Option C: Docker Compose**
```bash
docker-compose -f docker-compose-cassandra.yml up -d
```

See `CASSANDRA_SETUP.md` for more options.

### 1. Start Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
# Or on Windows: mvnw.cmd spring-boot:run
```

Backend will run on `http://localhost:8080`

### 2. Start Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Connect to Cassandra

1. Open `http://localhost:5173`
2. Click "+ Add Connection" button
3. Enter connection details:
   - Host(s): `localhost:9042`
   - Datacenter: `datacenter1`
   - (Optional) Username/Password
4. Click "Test Connection"
5. Click "Connect"

## Development

### Backend Development

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Development

```bash
cd frontend
npm run dev
```

## Building for Production

### Build Frontend

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Build Backend

```bash
cd backend
./mvnw package
# Output: backend/target/cassandra-browser-api-1.0.0.jar
```

## API Endpoints

### Connection Management
- `POST /api/clusters/test-connection` - Test connection
- `POST /api/clusters` - Add cluster connection
- `GET /api/clusters` - Get all clusters
- `DELETE /api/clusters/{id}` - Remove cluster

### Metadata
- `GET /api/clusters/{id}/keyspaces` - Get keyspaces
- `GET /api/clusters/{id}/keyspaces/{name}/tables` - Get tables
- `GET /api/clusters/{id}/keyspaces/{name}/tables/{table}` - Get table details
- `GET /api/clusters/{id}/keyspaces/{name}/tables/{table}/records?limit=10` - Get sample records

### Query Execution
- `POST /api/clusters/{id}/keyspaces/{name}/execute` - Execute CQL query

## Configuration

### Frontend Environment Variables

Create `frontend/.env.development`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Backend Configuration

Edit `backend/src/main/resources/application.properties`:
```properties
server.port=8080
spring.web.cors.allowed-origins=http://localhost:5173
```

## Security Notes

- Only SELECT queries are allowed (read-only mode)
- Query timeout: 30 seconds
- Max result size: 1000 rows
- Connection credentials stored in-memory (not persisted)

## License

MIT
