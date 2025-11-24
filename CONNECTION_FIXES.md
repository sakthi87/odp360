# Connection Error Fixes - Comprehensive Configuration

## Issues Addressed

Based on the error logs from your environment, the following issues have been fixed:

### 1. **PT2S Timeout Error**
- **Error**: `query 'SELECT * FROM system_schema.tables' timed out after PT2S`
- **Root Cause**: Schema metadata refresh was timing out after only 2 seconds
- **Fix**: Increased `METADATA_SCHEMA_REQUEST_TIMEOUT` from 2s to 30s

### 2. **Token Map Computation Errors**
- **Error**: `Error while computing token map for replication settings`
- **Root Cause**: Driver couldn't find required replicas during schema refresh
- **Fix**: Increased all metadata refresh timeouts to allow proper discovery

### 3. **Datacenter Mismatch Warnings**
- **Error**: `You specified cbc2 as the local DC, but some contact points are from a different DC`
- **Root Cause**: Configuration mismatch (this is informational, but we've made driver more tolerant)
- **Fix**: Increased connection timeouts to allow driver to discover correct topology

### 4. **"No node available to connect"**
- **Error**: `AllNodesFailedException: No node available to connect`
- **Root Cause**: Connection timeouts too short, network issues, or wrong configuration
- **Fix**: Increased all connection-related timeouts significantly

## Configuration Changes

### Timeout Settings (All Increased)

| Setting | Old Value | New Value | Purpose |
|---------|-----------|-----------|---------|
| `CONNECTION_CONNECT_TIMEOUT` | 10s | **30s** | Time to establish TCP connection |
| `REQUEST_TIMEOUT` | 30s | **60s** | Time to wait for query response |
| `CONTROL_CONNECTION_TIMEOUT` | 10s | **30s** | Time for control connection (metadata) |
| `METADATA_SCHEMA_REQUEST_TIMEOUT` | 2s (default) | **30s** | **CRITICAL: Fixes PT2S error** |
| `METADATA_SCHEMA_WINDOW` | Default | **30s** | Schema refresh window |
| `METADATA_TOPOLOGY_WINDOW` | 10s | **30s** | Topology refresh window |

### Connection Pool Settings

- `CONNECTION_POOL_LOCAL_SIZE`: 1 (minimal for connection testing)
- `CONNECTION_POOL_REMOTE_SIZE`: 1 (minimal for connection testing)

### Schema Metadata

- `METADATA_SCHEMA_ENABLED`: true (enabled with longer timeouts)

## Files Modified

1. **`ConnectionTestService.java`** - Connection testing with improved timeouts
2. **`ConnectionManager.java`** - Session creation with improved timeouts

## Testing the Fix

1. **Stop the old backend** (if running)
2. **Deploy the new JAR**: `backend-cassandra/target/cassandra-browser-api-1.0.0.jar`
3. **Start the backend**: `java -jar cassandra-browser-api-1.0.0.jar`
4. **Test connection** from the UI

## Important Notes

### Datacenter Name
- The datacenter name must **exactly match** your cluster's datacenter name
- Common names: `datacenter1`, `DC1`, `cbc2`, etc.
- Check with: `cqlsh -e "DESCRIBE CLUSTER;"`

### Network Connectivity
- Ensure all Cassandra nodes are reachable from the backend server
- Check firewall rules allow port 9042
- Verify DNS/hostname resolution works

### Token Map Warnings
- Token map errors are **warnings** during schema refresh
- They occur when the driver can't find all required replicas
- With increased timeouts, the driver will retry and eventually succeed
- If errors persist, check:
  - All nodes are up and running
  - Network connectivity to all nodes
  - Replication factor matches available nodes

## Expected Behavior After Fix

1. **Connection Test**: Should succeed within 30-60 seconds (instead of failing at 2s)
2. **Schema Refresh**: Will take longer but should complete successfully
3. **Token Map Warnings**: May still appear but won't cause connection failure
4. **Error Messages**: More descriptive, helping identify specific issues

## Troubleshooting

If you still see errors:

1. **PT2S Error**: Check network latency to Cassandra nodes
2. **Token Map Error**: Verify all nodes in the cluster are accessible
3. **Datacenter Mismatch**: Double-check the datacenter name matches exactly
4. **Connection Timeout**: Verify Cassandra is running and accessible on port 9042

## Next Steps

1. Deploy the new JAR to your environment
2. Test connection with correct datacenter name
3. Monitor logs for any remaining issues
4. If problems persist, check network connectivity and Cassandra cluster health

