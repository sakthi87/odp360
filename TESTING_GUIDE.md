# Testing Guide

## ✅ Services Status

- **Backend**: Running on `http://localhost:8080`
- **Frontend**: Running on `http://localhost:5173`
- **Cassandra**: Running in Docker on `localhost:9042`

## 🧪 Testing Steps

### 1. Open the Application

Open your browser and go to:
**http://localhost:5173**

### 2. Connect to Cassandra

1. Click the **"+ Add Connection"** button in the left panel
2. Fill in the connection form:
   - **Connection Name**: `Local Cassandra` (optional)
   - **Host(s)**: `localhost:9042`
   - **Datacenter**: `datacenter1`
   - **Username**: (leave empty)
   - **Password**: (leave empty)
   - **Default Keyspace**: (leave empty)
3. Click **"Test Connection"**
   - Should show: "✓ Connection successful"
4. Click **"Connect"**

### 3. Browse the Data

After connecting, you should see:

**Left Panel:**
- `Local Cassandra` cluster
- Expand to see:
  - `profile_datastore` keyspace
    - `Customer` table
    - `Customer_Address` table
    - `Customer_Phone` table
    - `Customer_Email` table
  - `transaction_datastore` keyspace
    - `dda_transactions` table
    - `ccd_transactions` table

### 4. Test Table Selection

1. Click on **`Customer`** table
2. You should see:
   - **Right Panel**: Table schema (columns, data types, indexes)
   - **Bottom Panel**: Top 10 records from Customer table
   - **Center Panel**: Auto-generated SELECT query

### 5. Test Query Execution

1. In the **Query Builder** (center panel), you'll see:
   ```sql
   SELECT customer_id, first_name, last_name, date_of_birth, created_at, updated_at 
   FROM profile_datastore.Customer 
   LIMIT 10
   ```

2. **Modify the query** (optional):
   ```sql
   SELECT customer_id, first_name, last_name 
   FROM profile_datastore.Customer 
   WHERE first_name = 'John' 
   LIMIT 5
   ```

3. Click **"Execute"** button (or press Ctrl+Enter)
4. Results appear in the **bottom panel** with execution time

### 6. Test Other Tables

Try selecting:
- `dda_transactions` - See checking/savings transactions
- `ccd_transactions` - See credit card transactions
- `Customer_Address` - See customer addresses

### 7. Test Resizable Panels

- **Drag vertical dividers** between left/center/right panels to resize
- **Drag horizontal divider** above bottom panel to resize

## 🔍 API Testing (Optional)

You can also test the backend API directly:

### Test Connection
```bash
curl -X POST http://localhost:8080/api/clusters/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "hosts": ["localhost:9042"],
    "datacenter": "datacenter1"
  }'
```

### Get Keyspaces
```bash
curl http://localhost:8080/api/clusters/{clusterId}/keyspaces
```

### Execute Query
```bash
curl -X POST http://localhost:8080/api/clusters/{clusterId}/keyspaces/profile_datastore/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM profile_datastore.Customer LIMIT 5"
  }'
```

## ✅ Expected Results

### After Connecting:
- Left panel shows your cluster
- Can expand to see keyspaces
- Can expand keyspaces to see tables

### After Selecting a Table:
- Right panel shows table schema
- Bottom panel shows sample records
- Center panel shows auto-generated query

### After Executing a Query:
- Bottom panel shows query results
- Execution time displayed
- Results formatted in table

## 🐛 Troubleshooting

### Backend not responding:
```bash
# Check if running
lsof -ti:8080

# Check logs
cd backend-cassandra
./mvnw spring-boot:run
```

### Frontend not loading:
```bash
# Check if running
lsof -ti:5173

# Restart
cd frontend
npm run dev
```

### Connection fails:
- Verify Cassandra is running: `docker ps | grep cassandra`
- Check Cassandra logs: `docker logs cassandra-test`
- Wait 30 seconds after starting Cassandra

### CORS errors:
- Check backend CORS config in `application.properties`
- Verify frontend API URL in `.env.development`

## 🎯 Test Checklist

- [ ] Frontend loads at http://localhost:5173
- [ ] "+ Add Connection" button works
- [ ] Connection dialog opens
- [ ] Test connection succeeds
- [ ] Connect button adds cluster
- [ ] Can expand cluster to see keyspaces
- [ ] Can expand keyspace to see tables
- [ ] Selecting table shows schema in right panel
- [ ] Selecting table shows records in bottom panel
- [ ] Query builder auto-generates query
- [ ] Can modify query
- [ ] Execute button works
- [ ] Query results display in bottom panel
- [ ] Panels are resizable

Happy Testing! 🚀

