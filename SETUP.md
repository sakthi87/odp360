# Setup Instructions

## Prerequisites

- **Java 17+** (for Spring Boot backend)
- **Maven 3.6+** (for building backend)
- **Node.js 16+** (for React frontend)
- **Cassandra Cluster** (for testing)

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run
```

Backend will start on `http://localhost:8080`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start on `http://localhost:5173`

### 3. Connect to Cassandra

1. Open browser: `http://localhost:5173`
2. Click **"+ Add Connection"** button
3. Fill in connection details:
   - **Connection Name**: Dev Cluster (optional)
   - **Host(s)**: `localhost:9042`
   - **Datacenter**: `datacenter1`
   - **Username/Password**: (if required)
4. Click **"Test Connection"**
5. If successful, click **"Connect"**

## Project Structure

```
ODP360/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
└── backend/           # Spring Boot API
    ├── src/
    │   └── main/
    │       ├── java/
    │       └── resources/
    └── pom.xml
```

## Environment Variables

### Frontend
Create `frontend/.env.development`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Backend
Edit `backend/src/main/resources/application.properties`:
```properties
server.port=8080
spring.web.cors.allowed-origins=http://localhost:5173
```

## Building for Production

### Backend
```bash
cd backend
./mvnw clean package
# JAR file: target/cassandra-browser-api-1.0.0.jar
```

### Frontend
```bash
cd frontend
npm run build
# Static files: dist/
```

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Troubleshooting

### Backend won't start
- Check Java version: `java -version` (should be 17+)
- Check if port 8080 is available
- Check Maven installation: `./mvnw --version`

### Frontend won't connect to backend
- Verify backend is running on port 8080
- Check CORS configuration in `application.properties`
- Verify `VITE_API_BASE_URL` in `.env.development`

### Connection to Cassandra fails
- Verify Cassandra is running
- Check host and port (default: localhost:9042)
- Verify datacenter name matches your cluster
- Check credentials if authentication is enabled

