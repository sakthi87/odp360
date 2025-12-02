# Cassandra Data Modeling - Quick Reference Summary

## 📋 Overview

This is a **quick reference guide** for the complete Cassandra data modeling system. For detailed information, see:
- `CASSANDRA_DATA_MODELING_RULES.md` - Complete rules and best practices
- `CASSANDRA_MODELING_PROCESS.md` - Step-by-step process and UI design
- `RULES_REVISION_ANALYSIS.md` - Comparison with original rules

---

## 🎯 Core Principles

1. **Query-Driven Design**: Design tables based on access patterns, not normalized data
2. **Denormalization**: Duplicate data across tables to optimize reads
3. **Partition Distribution**: Ensure even data distribution across cluster
4. **Partition Size**: Keep partitions between 10MB - 100MB
5. **Single Partition Queries**: Design for queries that hit one partition

---

## 🔑 Partition Key (PK) Rules

### ✅ MUST:
- High cardinality (1000+ unique values)
- Stable and immutable
- Part of primary access pattern
- Even distribution across cluster

### ❌ MUST NOT:
- Use time-based fields (unless bucketed)
- Use low-cardinality fields (< 100 values)
- Use mutable/volatile fields
- Create partitions > 100MB

### ⚠️ COMPOSITE PK:
- Use for multi-tenant: `(tenant_id, entity_id)`
- Use for time-series: `(entity_id, date_bucket)`
- Use for size control: Add bucket field

---

## 📊 Clustering Key (CK) Rules

### ✅ ORDERING RULE:
1. **Equality filters first** (WHERE field = ?)
2. **Range filters second** (WHERE field > ?)
3. **Sorting fields last** (ORDER BY field ASC/DESC)

### ✅ MUST:
- Support primary access pattern
- Ensure uniqueness (PK + CK)
- Place time fields last with DESC for time-series

### ❌ MUST NOT:
- Include unused fields
- Include optional/nullable fields
- Break query flow (can't skip CK in WHERE)

---

## 🔍 Index (SAI) Rules

### ✅ CREATE INDEX WHEN:
- Field used in WHERE but not in PK/CK
- Field has acceptable cardinality (High/Medium/Low)
- Field is relatively stable (not frequently updated)

### ⚠️ LIMITATIONS:
- **No index joins**: Can't use multiple indexed columns in one WHERE
- **Write overhead**: Each index adds write cost
- **Query performance**: Slower than PK-based queries

### ❌ AVOID INDEXES FOR:
- Fields in PK/CK (redundant)
- Very frequently updated fields
- Very low cardinality (< 10 values) - use materialized view
- Multiple indexed columns in same query

### 🔄 ALTERNATIVES:
- **Materialized Views**: For complex patterns
- **Denormalization**: Create separate table
- **Redesign PK/CK**: Include field in primary key

---

## 📝 Data Collection Requirements

### Required Information:

1. **CSV Upload**
   - `column_name`, `data_type`, `description` (optional)

2. **Field Annotation** (Required)
   - Business key (boolean)
   - Mutable (boolean)
   - **Cardinality** (High/Medium/Low) - **REQUIRED**
   - Tenant field (boolean)
   - Time field (boolean)

3. **Primary Access Pattern** (Required)
   - Query description
   - Fields used (multi-select)
   - Filter types (equality/range/IN)
   - Sort fields with direction (ASC/DESC)
   - Query frequency (optional)

4. **Secondary Access Patterns** (Optional)
   - Same as primary, but for additional queries
   - Determines which fields need indexes

5. **Operational Constraints** (Optional)
   - Partition size expectation
   - Query volume (read/write/balanced)
   - Multi-tenant flag
   - Time-series flag
   - TTL requirements

---

## 🖥️ UI Design - Single Row Per Entity

### Table Columns:

| Column | Contents |
|-------|----------|
| **Entity Name** | Editable + status badges |
| **CSV Fields** | Badge + "View/Edit" button |
| **Field Attributes** | Collapsible annotation table |
| **Primary Pattern** | Button + summary |
| **Secondary Patterns** | Button + count |
| **Constraints** | Button + summary |
| **Status** | Progress indicator |
| **Actions** | Generate/Preview/Download |

### Modal Dialogs:

1. **Field Annotation**: Edit business key, mutable, cardinality
2. **Primary Pattern**: Define main query pattern
3. **Secondary Patterns**: Add multiple additional patterns
4. **Constraints**: Set operational metadata

---

## ⚙️ Rule Application Logic

### Partition Key Selection:
```
1. Find fields in primary pattern with HIGH cardinality
2. Filter out mutable fields
3. Filter out time-based fields
4. Prefer business keys
5. Return first candidate
```

### Clustering Key Selection:
```
1. Equality filters first (from primary pattern)
2. Range filters second
3. Sort fields last (with ASC/DESC)
4. Exclude partition key
```

### Index Selection:
```
1. For each secondary pattern field
2. If field not in PK/CK
3. If cardinality acceptable
4. Add to index list
```

---

## ✅ Validation Checklist

Before generating model, verify:

- [ ] CSV uploaded and parsed
- [ ] All fields have cardinality set
- [ ] Primary access pattern defined
- [ ] At least one high-cardinality field in primary pattern
- [ ] Partition key candidate identified
- [ ] Estimated partition size < 100MB
- [ ] No time field as sole PK
- [ ] Clustering keys ordered correctly
- [ ] Indexes only on fields not in PK/CK

---

## 🚫 Anti-Patterns

### ❌ DO NOT:

1. **Use ALLOW FILTERING** → Redesign PK/CK
2. **Use joins** → Denormalize data
3. **Normalize data** → Duplicate across tables
4. **Time-based PK alone** → Use bucketing
5. **Too many indexes** → Use materialized views
6. **Ignore partition size** → Implement bucketing

---

## 📐 Example: Quick Decision Tree

```
Start: User uploads CSV
  ↓
Annotate fields (cardinality required)
  ↓
Define primary access pattern
  ↓
System selects PK:
  - High cardinality field from pattern?
    YES → Use it
    NO → Error: Need high-cardinality field
  ↓
System selects CK:
  - Equality filters → Range → Sort
  ↓
System selects Indexes:
  - Secondary pattern fields not in PK/CK?
    YES → Create index
    NO → Skip
  ↓
Validate partition size:
  - Estimated > 100MB?
    YES → Recommend bucketing
    NO → Proceed
  ↓
Generate CQL
```

---

## 🔧 CQL Generation Template

```sql
-- Table Creation
CREATE TABLE IF NOT EXISTS {table_name} (
    {all_fields},
    PRIMARY KEY (({partition_key}), {clustering_keys})
) WITH CLUSTERING ORDER BY ({clustering_order});

-- Indexes
CREATE CUSTOM INDEX IF NOT EXISTS {index_name}
ON {table_name} ({field})
USING 'StorageAttachedIndex';

-- Optional: TTL
-- WITH default_time_to_live = {seconds};
```

---

## 📊 Status Indicators

### Entity Row Status:

- 🟢 **CSV Uploaded**: File parsed successfully
- 🟢 **Fields Annotated**: All fields have cardinality
- 🟢 **Primary Pattern Set**: Main query defined
- 🟡 **Secondary Patterns**: Optional but recommended
- 🟡 **Constraints Set**: Optional metadata
- 🔴 **Ready**: All required data complete

---

## 🎓 Key Learnings from Research

1. **Partition Size is Critical**: 10-100MB target, monitor closely
2. **Time-Series Needs Bucketing**: Never use time alone as PK
3. **Indexes Have Trade-offs**: Understand write performance impact
4. **Query-Driven is Mandatory**: Design for queries, not data structure
5. **Denormalization is Expected**: Duplicate data for performance

---

## 📚 Next Steps

1. **Review** complete rules document
2. **Understand** process and UI design
3. **Implement** backend rule engine
4. **Build** frontend UI components
5. **Test** with real-world examples
6. **Iterate** based on user feedback

---

## 🔗 Document Links

- **Complete Rules**: `CASSANDRA_DATA_MODELING_RULES.md`
- **Process & UI**: `CASSANDRA_MODELING_PROCESS.md`
- **Revision Analysis**: `RULES_REVISION_ANALYSIS.md`
- **This Summary**: `CASSANDRA_MODELING_SUMMARY.md`

---

**Last Updated**: Based on research from DataStax, Apache Cassandra, Instaclustr, and industry best practices (2024)

