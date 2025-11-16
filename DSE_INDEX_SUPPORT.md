# DSE 5.1.33 Index Support

## Overview

The application now supports displaying both **CQL Secondary Indexes** and **DSE Solr Search Indexes** for DataStax Enterprise 5.1.33.

## Index Types

### 1. CQL Secondary Indexes
- **Source**: `system_schema.indexes` table
- **Query**: Standard CQL query to get indexes for a table
- **Display**: Shows index name, column, kind (KEYS, COMPOSITES, CUSTOM), and options

### 2. DSE Solr Search Indexes
- **Source**: `dse_search.solr_resources` table
- **Query**: Queries DSE Search system tables to find Solr cores associated with tables
- **Display**: Shows Solr core name, resource name, and config name

## How It Works

### Backend Implementation

1. **CQL Indexes** (`CassandraMetadataService.java`):
   ```java
   SELECT index_name, kind, options 
   FROM system_schema.indexes 
   WHERE keyspace_name = ? AND table_name = ?
   ```

2. **Solr Indexes**:
   - First checks if `dse_search` keyspace exists (DSE Search is enabled)
   - Queries `dse_search.solr_resources` for Solr cores
   - Matches cores to tables by naming pattern: `keyspace_table_name`
   - Falls back to querying all resources and filtering if direct query fails

### Frontend Display

The `TableDetails` component now shows:
- **Index Name**: Name of the index or Solr core
- **Column**: Column name (for CQL indexes) or "N/A" (for Solr indexes)
- **Index Type**: Badge showing "CQL" or "SOLR"
- **Details**: Additional options/configuration

## DSE 5.1.33 System Tables

### CQL Indexes
- **Table**: `system_schema.indexes`
- **Columns**: `index_name`, `keyspace_name`, `table_name`, `kind`, `options`

### Solr Indexes
- **Keyspace**: `dse_search`
- **Table**: `solr_resources`
- **Columns**: `core_name`, `resource_name`, `config_name`
- **Naming Convention**: Solr cores are typically named `keyspace_table_name`

## Testing

### Verify CQL Indexes
```sql
SELECT index_name, kind, options 
FROM system_schema.indexes 
WHERE keyspace_name = 'your_keyspace' 
  AND table_name = 'your_table';
```

### Verify Solr Indexes
```sql
-- Check if DSE Search is enabled
SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'dse_search';

-- Query Solr resources
SELECT core_name, resource_name, config_name 
FROM dse_search.solr_resources 
WHERE core_name LIKE 'your_keyspace_your_table%';
```

## Error Handling

The implementation includes error handling:
- If `dse_search` keyspace doesn't exist, Solr queries are skipped
- If queries fail (permissions, etc.), errors are logged but don't break the application
- CQL and Solr index queries are independent - one can fail without affecting the other

## Known Limitations

1. **Solr Core Naming**: The code assumes Solr cores follow the pattern `keyspace_table_name`. If your environment uses different naming, you may need to adjust the matching logic.

2. **DSE Version**: This is optimized for DSE 5.1.33. Different DSE versions may have different system table structures.

3. **Permissions**: Users need appropriate permissions to query:
   - `system_schema.indexes` (for CQL indexes)
   - `dse_search.solr_resources` (for Solr indexes)

## Customization

If your DSE environment uses different naming conventions or table structures:

1. **Update Solr Core Matching** (`CassandraMetadataService.java`):
   ```java
   // Adjust the pattern matching logic around line 127-162
   String solrCoreName = keyspaceName + "_" + tableName;
   ```

2. **Add Additional Solr Tables**: If DSE 5.1.33 uses additional tables for Solr metadata, add queries in the same method.

## Example Output

### CQL Secondary Index
```
Index Name: idx_customer_email
Column: email_address
Index Type: CQL (KEYS)
Details: {target=email_address}
```

### Solr Search Index
```
Index Name: profile_datastore_Customer
Column: N/A
Index Type: SOLR (Solr Search)
Details: resource=..., config=...
```

## Troubleshooting

### Solr Indexes Not Showing

1. **Check DSE Search is enabled**:
   ```sql
   SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'dse_search';
   ```

2. **Verify Solr core exists**:
   ```sql
   SELECT * FROM dse_search.solr_resources WHERE core_name LIKE '%your_table%';
   ```

3. **Check user permissions**: User needs SELECT permission on `dse_search.solr_resources`

4. **Check naming convention**: Verify your Solr cores follow the expected naming pattern

### CQL Indexes Not Showing

1. **Check permissions**: User needs SELECT permission on `system_schema.indexes`
2. **Verify indexes exist**:
   ```sql
   SELECT * FROM system_schema.indexes 
   WHERE keyspace_name = 'your_keyspace' AND table_name = 'your_table';
   ```

## Next Steps

- Test with your actual DSE 5.1.33 environment
- Verify Solr core naming conventions match the code
- Adjust matching logic if needed for your specific setup
- Consider adding more Solr metadata (schema fields, etc.) if needed

