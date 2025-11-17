# Backend API Test Commands

Quick reference for testing backend endpoints using `curl`.

## Prerequisites

- Backend running on `http://localhost:8080`
- Or replace `localhost:8080` with your server hostname/port

---

## 1. Health Check - Get All Clusters

**Test if backend is running and responding:**

```bash
curl http://localhost:8080/api/clusters
```

**Expected Response:**
```json
[]
```
(Empty array if no clusters connected, or list of clusters)

**With verbose output:**
```bash
curl -v http://localhost:8080/api/clusters
```

**With pretty JSON:**
```bash
curl http://localhost:8080/api/clusters | python3 -m json.tool
# OR
curl http://localhost:8080/api/clusters | jq
```

---

## 2. Test Connection

**Test connection to a Cassandra/DSE cluster:**

```bash
curl -X POST http://localhost:8080/api/clusters/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "hosts": ["localhost:9042"],
    "datacenter": "datacenter1",
    "username": "",
    "password": ""
  }'
```

**With authentication:**
```bash
curl -X POST http://localhost:8080/api/clusters/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "hosts": ["your-host:9042"],
    "datacenter": "datacenter1",
    "username": "cassandra",
    "password": "password"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

**Expected Response (Failure):**
```json
{
  "success": false,
  "message": "Connection failed: ..."
}
```

---

## 3. Add Connection

**Register a new cluster connection:**

```bash
curl -X POST http://localhost:8080/api/clusters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Cassandra",
    "hosts": ["localhost:9042"],
    "datacenter": "datacenter1",
    "username": "",
    "password": ""
  }'
```

**Expected Response:**
```json
{
  "clusterId": "uuid-here",
  "name": "Local Cassandra",
  "status": "connected",
  "datacenter": "datacenter1"
}
```

**Save clusterId for next commands:**
```bash
# Save response to variable
CLUSTER_ID=$(curl -s -X POST http://localhost:8080/api/clusters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Cassandra",
    "hosts": ["localhost:9042"],
    "datacenter": "datacenter1"
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['clusterId'])")

echo "Cluster ID: $CLUSTER_ID"
```

---

## 4. Get Keyspaces

**List all keyspaces for a cluster:**

```bash
# Replace {clusterId} with actual cluster ID
curl http://localhost:8080/api/clusters/{clusterId}/keyspaces
```

**Example:**
```bash
curl http://localhost:8080/api/clusters/550e8400-e29b-41d4-a716-446655440000/keyspaces
```

**Expected Response:**
```json
[
  {
    "name": "profile_datastore",
    "replication": {
      "class": "SimpleStrategy",
      "replication_factor": "1"
    }
  },
  {
    "name": "transaction_datastore",
    "replication": {
      "class": "SimpleStrategy",
      "replication_factor": "1"
    }
  }
]
```

---

## 5. Get Tables

**List all tables in a keyspace:**

```bash
curl http://localhost:8080/api/clusters/{clusterId}/keyspaces/{keyspaceName}/tables
```

**Example:**
```bash
curl http://localhost:8080/api/clusters/550e8400-e29b-41d4-a716-446655440000/keyspaces/profile_datastore/tables
```

**Expected Response:**
```json
[
  {
    "name": "Customer"
  },
  {
    "name": "Customer_Address"
  },
  {
    "name": "Customer_Email"
  },
  {
    "name": "Customer_Phone"
  }
]
```

---

## 6. Get Table Details

**Get schema, columns, and indexes for a table:**

```bash
curl http://localhost:8080/api/clusters/{clusterId}/keyspaces/{keyspaceName}/tables/{tableName}
```

**Example:**
```bash
curl http://localhost:8080/api/clusters/550e8400-e29b-41d4-a716-446655440000/keyspaces/profile_datastore/tables/Customer
```

**Expected Response:**
```json
{
  "tableName": "Customer",
  "keyspaceName": "profile_datastore",
  "columns": [
    {
      "name": "customer_id",
      "dataType": "uuid",
      "kind": "PARTITION_KEY",
      "position": 0
    },
    {
      "name": "customer_name",
      "dataType": "text",
      "kind": "REGULAR",
      "position": -1
    }
  ],
  "indexes": [
    {
      "name": "idx_customer_name",
      "column": "customer_name",
      "type": "COMPOSITES",
      "indexType": "CQL",
      "options": "{}"
    }
  ]
}
```

---

## 7. Get Table Records (Top 10)

**Get sample records from a table:**

```bash
curl "http://localhost:8080/api/clusters/{clusterId}/keyspaces/{keyspaceName}/tables/{tableName}/records?limit=10"
```

**Example:**
```bash
curl "http://localhost:8080/api/clusters/550e8400-e29b-41d4-a716-446655440000/keyspaces/profile_datastore/tables/Customer/records?limit=10"
```

**Expected Response:**
```json
{
  "columns": ["customer_id", "customer_name", "email"],
  "rows": [
    {
      "customer_id": "550e8400-e29b-41d4-a716-446655440001",
      "customer_name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "rowCount": 1,
  "executionTime": 45,
  "error": null
}
```

---

## 8. Execute Query

**Execute a custom CQL query:**

```bash
curl -X POST http://localhost:8080/api/clusters/{clusterId}/keyspaces/{keyspaceName}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM profile_datastore.Customer LIMIT 5"
  }'
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/clusters/550e8400-e29b-41d4-a716-446655440000/keyspaces/profile_datastore/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT customer_id, customer_name FROM Customer LIMIT 5"
  }'
```

**Expected Response:**
```json
{
  "columns": ["customer_id", "customer_name"],
  "rows": [
    {
      "customer_id": "550e8400-e29b-41d4-a716-446655440001",
      "customer_name": "John Doe"
    }
  ],
  "rowCount": 1,
  "executionTime": 32,
  "error": null
}
```

---

## 9. Remove Connection

**Remove a cluster connection:**

```bash
curl -X DELETE http://localhost:8080/api/clusters/{clusterId}
```

**Example:**
```bash
curl -X DELETE http://localhost:8080/api/clusters/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response:**
- HTTP 204 No Content (success)
- Or HTTP 404 if cluster not found

---

## Complete Test Script

**Test all endpoints in sequence:**

```bash
#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "1. Testing backend health..."
curl -s "$BASE_URL/clusters" | python3 -m json.tool
echo ""

echo "2. Testing connection..."
curl -s -X POST "$BASE_URL/clusters/test-connection" \
  -H "Content-Type: application/json" \
  -d '{
    "hosts": ["localhost:9042"],
    "datacenter": "datacenter1"
  }' | python3 -m json.tool
echo ""

echo "3. Adding connection..."
RESPONSE=$(curl -s -X POST "$BASE_URL/clusters" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cluster",
    "hosts": ["localhost:9042"],
    "datacenter": "datacenter1"
  }')
echo "$RESPONSE" | python3 -m json.tool

CLUSTER_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['clusterId'])")
echo "Cluster ID: $CLUSTER_ID"
echo ""

if [ ! -z "$CLUSTER_ID" ]; then
  echo "4. Getting keyspaces..."
  curl -s "$BASE_URL/clusters/$CLUSTER_ID/keyspaces" | python3 -m json.tool
  echo ""
  
  echo "5. Getting tables (first keyspace)..."
  # Get first keyspace name
  KEYSPACE=$(curl -s "$BASE_URL/clusters/$CLUSTER_ID/keyspaces" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['name'])" 2>/dev/null)
  if [ ! -z "$KEYSPACE" ]; then
    echo "Keyspace: $KEYSPACE"
    curl -s "$BASE_URL/clusters/$CLUSTER_ID/keyspaces/$KEYSPACE/tables" | python3 -m json.tool
  fi
fi
```

---

## Error Responses

**Connection Error:**
```json
{
  "timestamp": "2024-11-17T12:00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Failed to connect to cluster",
  "path": "/api/clusters/test-connection"
}
```

**Validation Error:**
```json
{
  "timestamp": "2024-11-17T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/clusters"
}
```

**Not Found:**
```json
{
  "timestamp": "2024-11-17T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Cluster not found",
  "path": "/api/clusters/invalid-id/keyspaces"
}
```

---

## Quick Health Check

**One-liner to check if backend is running:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/clusters
# Returns: 200 (if working)
```

**With timeout:**
```bash
curl --max-time 5 http://localhost:8080/api/clusters
```

---

## Tips

1. **Use `-v` flag for verbose output** to see headers and connection details
2. **Use `-i` flag** to include response headers
3. **Use `jq` or `python3 -m json.tool`** for pretty JSON formatting
4. **Save clusterId** from add connection response for subsequent calls
5. **Check HTTP status codes** - 200 = success, 4xx = client error, 5xx = server error

