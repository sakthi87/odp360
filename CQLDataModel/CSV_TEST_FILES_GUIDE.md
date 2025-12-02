# CSV Test Files Guide

This document describes the sample CSV files created for testing the Cassandra Data Modeling process.

## Available Test Files

### 1. `sample-customer-accounts.csv`
**Use Case**: Customer account management

**Fields**: 9 columns
- `customer_id` (uuid) - High cardinality
- `account_number` (text) - High cardinality, business key
- `region` (text) - Low cardinality
- `email` (text) - High cardinality
- `phone` (text) - Medium cardinality
- `status` (text) - Low cardinality
- `created_at` (timestamp) - Time field
- `last_login` (timestamp) - Time field
- `total_balance` (decimal)

**Suggested Access Patterns**:
- **Primary**: Get customer accounts by account_number and region, ordered by created_at DESC
- **Secondary**: Search by email, filter by status, sort by last_login

**Expected PK**: `account_number` (high cardinality, business key)
**Expected CK**: `region, created_at DESC`
**Expected Indexes**: `email`, `status`, `last_login`

---

### 2. `sample-orders.csv`
**Use Case**: E-commerce order management

**Fields**: 9 columns
- `order_id` (uuid) - High cardinality
- `customer_id` (uuid) - High cardinality
- `product_id` (text) - High cardinality
- `order_date` (timestamp) - Time field
- `delivery_date` (timestamp) - Time field
- `region` (text) - Low cardinality
- `status` (text) - Low cardinality
- `total_amount` (decimal)
- `payment_method` (text) - Low cardinality

**Suggested Access Patterns**:
- **Primary**: Get all orders for a customer ordered by order_date DESC
- **Secondary**: Search orders by status, query by region, search by product_id

**Expected PK**: `customer_id` (high cardinality, supports "all orders for customer")
**Expected CK**: `product_id, region, order_date DESC`
**Expected Indexes**: `status`

---

### 3. `sample-sensor-readings.csv`
**Use Case**: IoT sensor time-series data

**Fields**: 7 columns
- `sensor_id` (text) - High cardinality
- `location` (text) - Medium cardinality
- `device_type` (text) - Low cardinality
- `recorded_at` (timestamp) - Time field
- `temperature` (decimal)
- `humidity` (decimal)
- `status` (text) - Low cardinality

**Suggested Access Patterns**:
- **Primary**: Get sensor readings by sensor_id ordered by recorded_at DESC
- **Secondary**: Query by location, search by device_type, filter by status

**Expected PK**: `sensor_id` (high cardinality)
**Expected CK**: `location, device_type, recorded_at DESC`
**Expected Indexes**: `status`

---

### 4. `sample-user-sessions.csv`
**Use Case**: User session tracking

**Fields**: 8 columns
- `session_id` (uuid) - High cardinality
- `user_id` (text) - High cardinality
- `device_type` (text) - Low cardinality
- `login_timestamp` (timestamp) - Time field
- `logout_timestamp` (timestamp) - Time field
- `city` (text) - Medium cardinality
- `country` (text) - Low cardinality
- `ip_address` (text) - High cardinality

**Suggested Access Patterns**:
- **Primary**: Get login sessions by user_id ordered by login_timestamp DESC
- **Secondary**: Search by city, filter by device_type

**Expected PK**: `user_id` (high cardinality)
**Expected CK**: `device_type, city, login_timestamp DESC`
**Expected Indexes**: None (all filters in CK)

---

### 5. `sample-support-tickets.csv`
**Use Case**: Customer support ticket management

**Fields**: 8 columns
- `ticket_id` (uuid) - High cardinality
- `customer_id` (uuid) - High cardinality
- `issue_type` (text) - Low cardinality
- `priority` (text) - Low cardinality
- `created_at` (timestamp) - Time field
- `last_updated` (timestamp) - Time field
- `assigned_agent` (text) - Medium cardinality
- `status` (text) - Low cardinality

**Suggested Access Patterns**:
- **Primary**: Get tickets for a customer ordered by last_updated DESC
- **Secondary**: Search by status, filter by issue_type, find by priority

**Expected PK**: `customer_id` (high cardinality)
**Expected CK**: `issue_type, priority, last_updated DESC`
**Expected Indexes**: `status`

---

### 6. `sample-vehicle-telemetry.csv`
**Use Case**: Fleet vehicle telemetry tracking

**Fields**: 8 columns
- `vehicle_id` (text) - High cardinality
- `fleet_id` (text) - Low cardinality
- `recorded_at` (timestamp) - Time field
- `speed` (int)
- `fuel_level` (int)
- `latitude` (double)
- `longitude` (double)
- `status` (text) - Low cardinality

**Suggested Access Patterns**:
- **Primary**: Fetch telemetry by vehicle_id ordered by recorded_at DESC
- **Secondary**: Search by fleet_id, search by status

**Expected PK**: `vehicle_id` (high cardinality)
**Expected CK**: `fleet_id, recorded_at DESC`
**Expected Indexes**: `status`

---

## Testing Workflow

1. **Upload CSV**: Use the "Upload CSV" button in the Modeler tab
2. **Annotate Fields**: 
   - Mark high cardinality fields (customer_id, order_id, sensor_id, etc.)
   - Mark low cardinality fields (status, region, device_type, etc.)
   - Mark business keys (account_number)
   - Mark time fields (created_at, recorded_at, etc.)
3. **Set Primary Access Pattern**: Define the main query pattern
4. **Add Secondary Patterns**: Define additional query needs
5. **Set Constraints**: Optional - set partition size, multi-tenant, etc.
6. **Generate CQL**: Review PK/CK/Index recommendations and generated CQL

## Tips for Testing

- **Start Simple**: Begin with `sample-customer-accounts.csv` - it has clear high/low cardinality fields
- **Test Edge Cases**: 
  - Try `sample-orders.csv` with customer_id as PK (time-series pattern)
  - Try `sample-sensor-readings.csv` to test time-series bucketing recommendations
- **Validate Rules**: 
  - Ensure high-cardinality fields are selected for PK
  - Check that time fields are placed last in CK with DESC
  - Verify indexes are only created for fields not in PK/CK

## Expected Warnings

The modeler may show warnings for:
- Low-cardinality fields selected as PK candidates
- Mutable fields in PK
- Large partition size estimates
- Missing time bucketing for time-series data

These warnings help you refine your data model design.

