# Cassandra Permissions and Keyspace Visibility

## Your Understanding is Correct! ✅

### How Cassandra Permissions Work:

1. **Admin/Superuser Credentials:**
   - Can query `system_schema.keyspaces` and see **ALL** keyspaces
   - Includes system keyspaces: `system`, `system_schema`, `system_auth`, `system_distributed`, `system_traces`, `system_views`
   - Can access and modify any keyspace

2. **Regular User Credentials (Non-Admin):**
   - Can only query `system_schema.keyspaces` for keyspaces they have **permissions** on
   - Typically **cannot see** system keyspaces (no permission)
   - Can only see user-created keyspaces they've been granted access to
   - If they try to query system keyspaces, they'll get authorization errors

### Current Implementation:

The backend currently queries:
```java
SELECT keyspace_name, replication FROM system_schema.keyspaces
```

**What happens:**
- **Admin user**: Returns ALL keyspaces (including system_*)
- **Regular user**: Returns ONLY keyspaces they have permission to see (typically excludes system_*)

Cassandra automatically filters based on the connected user's permissions!

### Example Scenarios:

#### Scenario 1: Admin User
```
Username: cassandra (default superuser)
Password: cassandra

Result: Sees all keyspaces:
- system
- system_schema
- system_auth
- system_distributed
- system_traces
- system_views
- profile_datastore
- transaction_datastore
```

#### Scenario 2: Regular User
```
Username: app_user
Password: app_password
Permissions: SELECT on profile_datastore, transaction_datastore

Result: Sees only:
- profile_datastore
- transaction_datastore
```

#### Scenario 3: User with No Permissions
```
Username: readonly_user
Password: readonly_password
Permissions: None

Result: Empty list or authorization error
```

## Recommended Enhancement

Even for admin users, you might want to **filter out system keyspaces** in the UI for better UX. System keyspaces are typically not meant for browsing by end users.

### Option 1: Filter System Keyspaces (Recommended)
Filter out keyspaces starting with `system_` in the backend or frontend.

### Option 2: Configurable Filter
Add a setting to show/hide system keyspaces.

### Option 3: Keep Current Behavior
Let Cassandra's permission system handle it (current implementation).

## Security Notes

- **Authorization is enforced by Cassandra** - users can only see what they have permission to see
- **No need to manually filter** based on user type - Cassandra does it automatically
- **System keyspaces are protected** - regular users cannot access them even if they try

## Testing Different Permission Levels

To test with different users:

1. **Create a regular user:**
```sql
CREATE USER app_user WITH PASSWORD 'app_password';
GRANT SELECT ON KEYSPACE profile_datastore TO app_user;
GRANT SELECT ON KEYSPACE transaction_datastore TO app_user;
```

2. **Connect with app_user** in the UI
3. **You should only see** `profile_datastore` and `transaction_datastore`

4. **Try to access system keyspace** (should fail):
```sql
SELECT * FROM system.local;  -- Will fail with authorization error
```

