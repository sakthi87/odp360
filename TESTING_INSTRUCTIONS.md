# ODP Intake Form - Testing Instructions

## CSV Files for Testing

Two sample CSV files have been created in the workspace root:

1. **sample-schema.csv** - For testing a User entity
2. **sample-orders-schema.csv** - For testing an Orders entity

## Test Flow - User Entity Example

### Step 1: Fill Project Details
- **ODP Intake ID**: `TEST-001`
- **Fund Type**: `Capital`
- **Fund Value**: `100000`
- **Business Line**: `Retail Banking`
- **Sub Domain**: `Customer Management`
- **Project Name**: `User Profile Management`
- **Project Description**: `Manage user profiles and authentication`
- **Source CAR ID**: `CAR-12345`
- **Consumer CAR ID**: `CAR-67890`
- **Tech Owner Email ID**: `tech.owner@example.com`
- **Developer Email ID**: `developer@example.com`
- **Exp Dev Date**: `2024-12-31`
- **Exp IT Date**: `2025-01-15`
- **UAT Date**: `2025-02-01`
- **Prod Date**: `2025-03-01`
- **Components**: Check `Cassandra` and `Data API`

### Step 2: Add Cassandra Entity
1. Click the **+** button in "Cassandra Details" section
2. Fill in the entity row:
   - **Entity Name**: `user_profiles`
   - **Description**: `Stores user profile information`
   - **SOR of Data**: `User Management System`
   - **Retention Period**: `5 years`
   - **Total Record Count**: `1000000`
   - **Record Size in Bytes**: `512`
   - **Volume in GB(Current Year)**: `500`
   - **Volume in GB(5 years)**: `2500`

### Step 3: Upload CSV Schema
1. Click **📄 Upload** button in the "CSV Schema" column
2. Select `sample-schema.csv` from the workspace root
3. You should see a green badge: **✓ 7 fields**
4. The expanded section will appear below showing the parsed schema

### Step 4: Define Query Access Patterns
1. In the expanded section, find **"Query Access Patterns"** (blue section)
2. Click **"+ Add Query"** button
3. Fill in:
   - **Query Description**: `Get user by ID`
   - **Pick Fields (for query)**: Check `id`
   - **Response Fields**: Check all fields (`id`, `name`, `email`, `created_at`, `updated_at`, `status`, `age`)
   - **Max. No Of Records**: `1`
4. Click **"+ Add Query"** again to add a second pattern:
   - **Query Description**: `Get users by email`
   - **Pick Fields (for query)**: Check `email`
   - **Response Fields**: Check all fields
   - **Max. No Of Records**: `1`
5. Click **"+ Add Query"** again to add a third pattern:
   - **Query Description**: `Get users by status ordered by created_at`
   - **Pick Fields (for query)**: Check `status` and `created_at`
   - **Response Fields**: Check all fields
   - **Max. No Of Records**: `100`

### Step 5: Define Uniqueness
1. In the **"Uniqueness"** section (purple section)
2. Click **"+ Add Uniqueness"** button
3. Check `id` (this will be the Primary Key)
4. Click **"+ Add Uniqueness"** again to add a second constraint:
   - Check `email` (for email uniqueness)

### Step 6: Review Primary Key & Clustering Keys
1. In the **"Primary Key & Clustering Keys"** section (green section)
2. **Primary Key (PK)** should auto-populate with: `id` (from first uniqueness constraint)
3. **Clustering Keys (CK)** should auto-populate with: `created_at` (from query patterns with timestamp fields)
4. You can manually edit these if needed

### Step 7: Submit Form
1. Click the **Submit** button at the bottom
2. The form will send data to the backend API

---

## Test Flow - Orders Entity Example

### Step 1: Add Second Entity Row
1. Click **+** button again in "Cassandra Details"
2. Fill in:
   - **Entity Name**: `orders`
   - **Description**: `Customer order records`
   - **SOR of Data**: `Order Management System`
   - **Retention Period**: `3 years`
   - **Total Record Count**: `5000000`
   - **Record Size in Bytes**: `1024`
   - **Volume in GB(Current Year)**: `5000`
   - **Volume in GB(5 years)**: `15000`

### Step 2: Upload CSV Schema
1. Click **📄 Upload** for the second row
2. Select `sample-orders-schema.csv`
3. You should see **✓ 7 fields**

### Step 3: Define Query Access Patterns
1. Click **"+ Add Query"**
2. Fill in:
   - **Query Description**: `Get orders by user_id and date range`
   - **Pick Fields (for query)**: Check `user_id` and `order_date`
   - **Response Fields**: Check all fields
   - **Max. No Of Records**: `100`
3. Add another query:
   - **Query Description**: `Get order by order_id`
   - **Pick Fields (for query)**: Check `order_id`
   - **Response Fields**: Check all fields
   - **Max. No Of Records**: `1`

### Step 4: Define Uniqueness
1. Click **"+ Add Uniqueness"**
2. Check `order_id` (Primary Key)

### Step 5: Review Keys
- **Primary Key (PK)**: `order_id`
- **Clustering Keys (CK)**: `order_date` (auto-detected from query patterns)

---

## Expected Behavior

1. **After CSV Upload**: 
   - Schema table appears with all fields
   - Query Access Patterns and Uniqueness sections become available

2. **When Selecting Fields in Query Patterns**:
   - Checkboxes appear for all CSV fields
   - Selected fields are highlighted
   - Clustering Keys auto-populate if timestamp/date fields are selected

3. **When Selecting Fields in Uniqueness**:
   - Checkboxes appear for all CSV fields
   - Primary Key auto-populates from first uniqueness constraint

4. **Form Submission**:
   - All data (query patterns, uniqueness, keys) is sent to backend
   - Backend generates CQL based on selections

---

## CSV File Format

Both CSV files follow this format:
```csv
field_name,description,datatype
id,Unique Identifier,UUID
name,User's Full Name,TEXT
...
```

**Required columns:**
- `field_name` (or any column containing "field" and "name")
- `datatype` (or any column containing "data" and "type")
- `description` (optional but recommended)

**Supported datatypes:**
- UUID, TEXT, INT, BIGINT, TIMESTAMP, DATE, DECIMAL, BOOLEAN, etc.

