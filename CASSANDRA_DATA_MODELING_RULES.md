# Cassandra Data Modeling Rules - Validated & Revised

## Executive Summary

This document provides **validated, research-backed rules** for Cassandra data modeling based on:
- Official Apache Cassandra documentation
- DataStax best practices
- Industry expert recommendations (Instaclustr, etc.)
- Analysis of real-world patterns

**Key Principle**: Cassandra is **query-driven** - design tables based on access patterns, not normalized data structures.

---

## 1. PARTITION KEY (PK) RULES

### ✅ MUST HAVE:

1. **High Cardinality** (Critical)
   - Must have a large number of unique values
   - Goal: Even distribution across cluster nodes
   - **Minimum**: At least 1000+ unique values (preferably 10,000+)
   - **Why**: Prevents hotspots and ensures load balancing

2. **Query-Driven Selection**
   - Must be part of the **primary access pattern**
   - If query is "fetch all records for X" → PK should include X
   - If query is "fetch records in group Y" → PK should include Y

3. **Stability & Immutability**
   - Value should **never change** after creation
   - Avoid mutable fields (status, flags, counters)
   - **Why**: Changing PK value requires rewriting entire row

4. **Avoid Time-Based Fields** (Critical)
   - Never use timestamp/date as sole partition key
   - **Exception**: Use time buckets (e.g., `(user_id, date_bucket)`) for time-series
   - **Why**: Time-based PKs create hotspots (all writes go to "today's" partition)

5. **Avoid Low-Cardinality Fields**
   - Status flags, boolean values, enums with few values
   - **Exception**: Can combine with high-cardinality field (composite PK)
   - **Why**: Creates hotspots (e.g., all "active" records in one partition)

### ⚠️ COMPOSITE PARTITION KEYS:

**When to use composite PK:**
- **Multi-tenancy**: `(tenant_id, entity_id)` - ensures tenant isolation
- **Time-series bucketing**: `(entity_id, date_bucket)` - prevents unbounded growth
- **Partition size control**: Add bucket field to limit partition size to 10-100MB

**Composite PK Order:**
1. High-cardinality identifier first
2. Bucketing/grouping field second (if needed)

### ❌ MUST NOT:

- Use fields that change frequently
- Use fields with < 100 unique values (unless part of composite)
- Use timestamp alone as PK
- Use fields with very long strings (unless required)
- Create partitions that will exceed 100MB

---

## 2. CLUSTERING KEY (CK) RULES

### ✅ MUST HAVE:

1. **Query Alignment**
   - Must support filtering and sorting in primary access pattern
   - All CK fields should be used in WHERE clauses or ORDER BY

2. **Uniqueness Guarantee**
   - PK + CK combination must uniquely identify each row
   - If not unique, add more CK fields or use UUID

3. **Proper Ordering** (Critical)
   - **Rule**: Equality filters → Range filters → Sorting fields
   - **Example**: `(region, category, created_at DESC)`
     - `region` = equality filter
     - `category` = equality filter  
     - `created_at` = sorting field

### 📋 CK ORDERING DETAILED RULES:

1. **Equality Filters First** (WHERE field = ?)
   - Low-cardinality filters: region, status, type, category
   - Medium-cardinality filters: city, department
   - **Why**: Enables efficient partition scanning

2. **Range Filters Second** (WHERE field > ? or BETWEEN)
   - Numeric ranges: price, age, score
   - **Why**: Supports range queries within partition

3. **Sorting Fields Last** (ORDER BY)
   - Timestamps: created_at, updated_at, event_time
   - Numeric sort fields: price, score, rank
   - **Must specify direction**: ASC or DESC
   - **Why**: Determines physical storage order

### ⚠️ TIME-SERIES CONSIDERATIONS:

- For time-series data, timestamp should be **last CK** with DESC (recent-first)
- Example: `(device_id, location, recorded_at DESC)`
- **Why**: Most queries want recent data first

### ❌ MUST NOT:

- Include high-cardinality fields that aren't used in queries
- Include optional/nullable fields (unless handled properly)
- Break query flow (can't skip CK fields in WHERE clause)
- Use fields that change frequently (unless required)

---

## 3. SECONDARY INDEX (SAI) RULES

### ✅ WHEN TO CREATE INDEX:

1. **Query Pattern Requirement**
   - Field is used in WHERE clause but **not in PK/CK**
   - Supports secondary access patterns
   - **Critical**: Only if query cannot be satisfied by PK/CK alone

2. **Cardinality Considerations**
   - **High cardinality** (1000+ unique values): ✅ Excellent for SAI
   - **Medium cardinality** (100-1000 values): ✅ Good for SAI
   - **Low cardinality** (< 100 values): ⚠️ Acceptable but monitor performance
   - **Very low** (< 10 values): ❌ Consider materialized view instead

3. **Field Characteristics**
   - Field is **relatively stable** (not updated frequently)
   - Field is **selective** (filters out significant portion of data)

### ⚠️ SAI LIMITATIONS:

1. **No Index Joins**
   - Cannot use multiple indexed columns in single WHERE clause
   - Example: `WHERE email = ? AND status = ?` (both indexed) → inefficient
   - **Solution**: Use materialized view or denormalize

2. **Write Performance Impact**
   - Each index update requires additional write
   - Monitor write latency with indexes enabled

3. **Query Performance**
   - Index queries may touch multiple partitions
   - Slower than PK-based queries (but faster than ALLOW FILTERING)

### ❌ AVOID INDEXES FOR:

- Very frequently updated fields
- Fields already in PK/CK (redundant)
- Multiple indexed columns in same query (use materialized view)
- Full table scans (design better PK/CK instead)
- Fields with extremely low cardinality (< 5 values) - use materialized view

### 🔄 ALTERNATIVES TO INDEXES:

1. **Materialized Views**: For complex query patterns
2. **Denormalization**: Create separate table for different access pattern
3. **Composite PK/CK**: Redesign primary key structure

---

## 4. PARTITION SIZE MANAGEMENT

### ✅ TARGET SIZE:

- **Optimal**: 10MB - 100MB per partition
- **Maximum**: 100MB (hard limit for performance)
- **Minimum**: No strict minimum, but avoid too many tiny partitions

### ⚠️ LARGE PARTITION PREVENTION:

**Strategies:**

1. **Time Bucketing**
   - Add date bucket to PK: `(user_id, date_bucket)`
   - Example: `date_bucket = '2024-01'` for monthly buckets
   - **Why**: Prevents unbounded growth for time-series data

2. **Composite Partition Key**
   - Split high-cardinality field: `(shard_id, entity_id)`
   - Example: `shard_id = hash(entity_id) % 10`
   - **Why**: Artificially creates more partitions

3. **TTL (Time-To-Live)**
   - Auto-expire old data: `WITH default_time_to_live = 86400`
   - **Why**: Prevents partition growth over time

### 📊 ESTIMATING PARTITION SIZE:

```
Partition Size = (Row Size × Expected Rows per Partition) + Overhead
```

**Monitor and adjust** if partitions exceed 100MB.

---

## 5. DATA MODELING PROCESS

### Step 1: Understand Queries
- Identify **primary access pattern** (most frequent query)
- Identify **secondary access patterns** (less frequent but needed)
- Document query frequency and performance requirements

### Step 2: Design Partition Key
- Select high-cardinality field from primary access pattern
- Ensure even distribution across cluster
- Consider composite PK if needed (multi-tenant, time-series)

### Step 3: Design Clustering Keys
- Order: Equality filters → Range filters → Sorting
- Ensure uniqueness (PK + CK)
- Support time-ordering if needed

### Step 4: Determine Indexes
- Only for fields not in PK/CK
- Check cardinality and update frequency
- Consider alternatives (materialized views, denormalization)

### Step 5: Validate & Test
- Estimate partition sizes
- Test query performance
- Monitor hotspot creation
- Adjust as needed

---

## 6. ANTI-PATTERNS TO AVOID

### ❌ Common Mistakes:

1. **Using ALLOW FILTERING**
   - Indicates poor data model design
   - **Fix**: Redesign PK/CK to support query

2. **Joins or Aggregations**
   - Cassandra doesn't support joins
   - **Fix**: Denormalize data, create materialized views

3. **Normalized Data Model**
   - Cassandra favors denormalization
   - **Fix**: Duplicate data across tables for different queries

4. **Time-Based Partition Keys**
   - Creates hotspots
   - **Fix**: Use time buckets in composite PK

5. **Too Many Indexes**
   - Degrades write performance
   - **Fix**: Use materialized views or denormalization

6. **Ignoring Partition Size**
   - Large partitions cause performance issues
   - **Fix**: Implement bucketing strategy

---

## 7. VALIDATION CHECKLIST

Before finalizing a Cassandra table design, verify:

- [ ] Partition key has high cardinality (1000+ unique values)
- [ ] Partition key is stable and immutable
- [ ] Partition key supports primary access pattern
- [ ] Clustering keys ordered correctly (equality → range → sort)
- [ ] PK + CK uniquely identifies rows
- [ ] Estimated partition size < 100MB
- [ ] Indexes only on fields not in PK/CK
- [ ] No ALLOW FILTERING required
- [ ] Queries can be satisfied by PK/CK or indexes
- [ ] Time-series data uses time bucketing (if needed)
- [ ] Multi-tenant data includes tenant_id in PK (if needed)

---

## 8. REVISIONS FROM PROVIDED RULES

### ✅ Improvements Made:

1. **Partition Size Management**: Added explicit 10-100MB target and bucketing strategies
2. **Composite PK Rules**: Clarified when and how to use composite partition keys
3. **CK Ordering**: More detailed explanation of equality → range → sort ordering
4. **Index Limitations**: Added warnings about index joins and write performance
5. **Alternatives**: Included materialized views and denormalization as alternatives
6. **Validation Checklist**: Added comprehensive checklist for design validation

### ⚠️ Corrections:

1. **Low-Cardinality Indexes**: Clarified that SAI can handle low-cardinality, but materialized views may be better
2. **Time-Based PK**: Strengthened warning - should never be sole PK
3. **Partition Size**: Added explicit size limits and monitoring requirements
4. **Query-Driven Design**: Emphasized this as the primary principle

---

## References

- Apache Cassandra Documentation: https://cassandra.apache.org/doc/
- DataStax Best Practices: https://docs.datastax.com/
- Instaclustr Blog: https://www.instaclustr.com/blog/cassandra-data-modeling/
- Cassandra Data Modeling Guide: https://cassandra.apache.org/doc/stable/cassandra/data_modeling/

