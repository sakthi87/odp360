# Setup Guide - Quick Start

Simple step-by-step guide to run the application in a new environment.

## Prerequisites

- **Java 17+** installed (`java -version`)
- **Node.js 16+** installed (`node -v`)

---

## Step 1: Run Backend

**Cassandra API:**
```bash
cd backend-cassandra
./mvnw spring-boot:run
```

**Kafka API (optional):**
```bash
cd backend-kafka
./mvnw spring-boot:run
```

**Expected output:**
```
Started CassandraBrowserApplication in X.XXX seconds
```

Backend runs on: `http://localhost:8080`

---

## Step 2: Validate Backend

Open a new terminal and run:

```bash
curl http://localhost:8080/api/clusters
```

**Expected response:**
```json
[]
```

If you see `[]` (empty array), backend is working correctly.

**Alternative:** Open browser: `http://localhost:8080/api/clusters` - should show `[]`

---

## Step 3: Run Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

Frontend runs on: `http://localhost:5173`

---

## Step 4: Validate Frontend

1. Open browser: `http://localhost:5173`
2. You should see:
   - "Online Data Platform" header with logo
   - Tabs: "Data Catalog", "C* Query", "YB Query", "Deployment"
   - "C* Query" tab shows the Cassandra browser interface

**If you see the UI, frontend is working correctly.**

---

## Quick Validation Commands

```bash
# Check backend
curl http://localhost:8080/api/clusters

# Check frontend (should return HTML)
curl http://localhost:5173
```

---

## Next Steps

Once both are running:

1. Click **"C* Query"** tab
2. Click **"+ Add Connection"** button
3. Enter your Cassandra/DSE connection details
4. Start browsing!

---

## Troubleshooting

**Backend won't start?**
- Check Java version: `java -version` (needs 17+)
- Check port 8080 is not in use: `lsof -i :8080`

**Frontend won't start?**
- Check Node.js version: `node -v` (needs 16+)
- Delete `node_modules` and run `npm install` again

**Can't connect to backend?**
- Verify backend is running on port 8080
- Check browser console for errors
- Verify CORS is configured (see DEPLOYMENT_CONFIG.md)

---

## Using Pre-built JAR (Alternative)

If you have the JAR file:

```bash
# Step 1: Run Backend
java -jar backend-cassandra/target/cassandra-browser-api-1.0.0.jar
```

# Step 2-4: Same as above
```

---

## Using Pre-built Frontend (Alternative)

If you have the built frontend:

```bash
# Step 3: Serve Frontend
cd frontend/dist
python3 -m http.server 8000

# Step 4: Open http://localhost:8000
```

