# Cassandra Data Modeling Process & UI Design

## Overview

This document defines the **step-by-step process** and **UI design** for collecting user inputs and generating Cassandra table models from CSV files.

**Key Principle**: Each entity is represented as a **single row** in a table, with pop-up modals for detailed information collection to save space.

---

## 1. PROCESS FLOW

### Phase 1: Entity Setup
1. User uploads CSV file for an entity
2. System parses CSV and extracts: `column_name`, `data_type`, `description` (optional)
3. System displays entity row with basic info

### Phase 2: Field Annotation
1. User annotates fields with metadata (inline table, collapsible)
2. System stores: business_key, mutable, cardinality tags

### Phase 3: Access Pattern Collection
1. User defines primary access pattern (required, modal)
2. User defines secondary access patterns (optional, modal)
3. System validates patterns against available fields

### Phase 4: Constraints & Metadata
1. User sets operational constraints (optional, modal)
2. System collects: partition size expectations, query volume, multi-tenant flag

### Phase 5: Model Generation
1. System applies rules to generate PK/CK/Index recommendations
2. System generates CQL script
3. User reviews and can override decisions
4. User downloads final CQL

---

## 2. DATA COLLECTION REQUIREMENTS

### 2.1 CSV Upload Requirements

**Required CSV Columns:**
- `column_name` (required): Field name
- `data_type` (required): Cassandra data type (TEXT, UUID, INT, TIMESTAMP, etc.)
- `description` (optional): Field description

**Example CSV:**
```csv
column_name,data_type,description
customer_id,UUID,Unique customer identifier
email,TEXT,Customer email address
created_at,TIMESTAMP,Account creation timestamp
status,TEXT,Account status: active/inactive
```

**System Actions:**
- Parse CSV and validate required columns
- Display parsed fields in entity row
- Enable field annotation step

---

### 2.2 Field Annotation (Required)

**Information Collected Per Field:**

| Attribute | Type | Purpose | Required |
|-----------|------|---------|----------|
| **Business Key** | Boolean | Identifies natural business identifier | No |
| **Mutable** | Boolean | Whether field value can change | No |
| **Cardinality** | Enum (High/Medium/Low/Unknown) | Number of unique values | **Yes** |
| **Tenant Field** | Boolean | Multi-tenant identifier | No |
| **Time Field** | Boolean | Timestamp/date field | No |

**UI Implementation:**
- Collapsible table in entity row
- Quick toggle buttons for common attributes
- Bulk selection for cardinality

**Why Required:**
- Cardinality is **critical** for PK selection
- Mutable flag helps avoid mutable PKs
- Business key helps prioritize PK candidates

---

### 2.3 Primary Access Pattern (Required)

**Information Collected:**

1. **Query Description** (Text)
   - Free-form description of the query
   - Example: "Get all orders for a customer ordered by order_date"

2. **Fields Used** (Multi-select)
   - Select fields from CSV that are used in WHERE clause
   - Select fields used in ORDER BY clause
   - Mark fields as: filter, sort, or both

3. **Filter Type** (Per field)
   - Equality filter: `WHERE field = ?`
   - Range filter: `WHERE field > ?` or `BETWEEN`
   - IN clause: `WHERE field IN (?, ?)`

4. **Sort Order** (Per sort field)
   - ASC or DESC
   - Field used for sorting

5. **Query Frequency** (Optional)
   - High/Medium/Low
   - Helps prioritize design decisions

**UI Implementation:**
- Modal dialog triggered from entity row
- Field selector with checkboxes
- Filter type dropdown per selected field
- Sort order selector for sort fields

**Validation:**
- At least one field must be selected
- Sort fields must be timestamp/numeric types
- All selected fields must exist in CSV

---

### 2.4 Secondary Access Patterns (Optional)

**Information Collected Per Pattern:**

1. **Pattern Description** (Text)
   - Example: "Search orders by status"

2. **Fields Used** (Multi-select)
   - Fields used in WHERE clause
   - Fields used in ORDER BY (if any)

3. **Filter Type** (Per field)
   - Same as primary pattern

4. **Query Frequency** (Optional)
   - High/Medium/Low

**UI Implementation:**
- Modal dialog with "Add Pattern" button
- Can add multiple secondary patterns
- Each pattern stored separately

**Why Important:**
- Determines which fields need indexes
- Helps identify if materialized views are needed

---

### 2.5 Operational Constraints (Optional)

**Information Collected:**

1. **Partition Size Expectation**
   - Small (< 10MB)
   - Medium (10-50MB)
   - Large (50-100MB)
   - Very Large (> 100MB) - triggers bucketing recommendation

2. **Query Volume**
   - Read-heavy
   - Write-heavy
   - Balanced

3. **Multi-Tenant**
   - Boolean: Is this multi-tenant data?
   - If yes, which field is tenant_id?

4. **Time-Series Data**
   - Boolean: Is this time-series data?
   - If yes, expected data retention period

5. **TTL Requirement**
   - Boolean: Should data expire?
   - If yes, TTL value in seconds

**UI Implementation:**
- Modal dialog with form fields
- Dropdowns and checkboxes
- Conditional fields based on selections

**Why Important:**
- Influences PK design (bucketing, composite keys)
- Affects TTL and retention settings
- Helps estimate partition sizes

---

## 3. UI DESIGN - SINGLE ROW PER ENTITY

### 3.1 Entity Table Layout

**Main Table Structure:**

| Column | Width | Contents | Actions |
|--------|-------|----------|---------|
| **Entity Name** | 15% | Editable text field<br>Status badges (CSV ✓, Fields ✓, Primary ✓, etc.) | Edit name |
| **CSV Fields** | 10% | Badge: "X fields"<br>Button: "View/Edit Fields" | Open field annotation table |
| **Field Attributes** | 15% | Collapsible table<br>Business key, mutable, cardinality | Expand/collapse |
| **Primary Pattern** | 15% | Button: "Set Primary Pattern"<br>Summary: "By customer_id, order_date" | Open modal |
| **Secondary Patterns** | 15% | Button: "Add Secondary (X)"<br>List of pattern summaries | Open modal |
| **Constraints** | 10% | Button: "Set Constraints"<br>Summary: "Multi-tenant, Medium size" | Open modal |
| **Status** | 10% | Progress indicator<br>Ready/Incomplete/Warning | - |
| **Actions** | 10% | Generate Model<br>Preview CQL<br>Download CQL | Buttons |

### 3.2 Status Badges

**Entity Row Status Indicators:**

- 🟢 **CSV Uploaded**: CSV file parsed successfully
- 🟢 **Fields Annotated**: All fields have cardinality set
- 🟢 **Primary Pattern Set**: Primary access pattern defined
- 🟡 **Secondary Patterns**: Optional, but recommended
- 🟡 **Constraints Set**: Optional operational metadata
- 🔴 **Ready to Generate**: All required fields completed

**Visual Indicators:**
- Green checkmark: Complete
- Yellow warning: Optional but recommended
- Red X: Missing required data
- Gray: Not started

---

### 3.3 Modal Dialogs

#### Modal 1: Field Annotation

**Trigger**: Click "View/Edit Fields" button

**Layout:**
```
┌─────────────────────────────────────────┐
│ Field Annotation - customer_orders      │
├─────────────────────────────────────────┤
│ [Collapsible Table]                     │
│                                          │
│ Column Name | Type | Business | Mutable│
│             |      | Key      |        │
│ customer_id | UUID | ☑       | ☐      │
│ order_date  | TS   | ☐       | ☐      │
│ status      | TEXT | ☐       | ☑      │
│ ...                                      │
│                                          │
│ Cardinality: [High ▼] [Medium] [Low]    │
│                                          │
│ [Bulk Actions] [Select All High]        │
│                                          │
│ [Save] [Cancel]                         │
└─────────────────────────────────────────┘
```

**Features:**
- Inline editing of attributes
- Bulk selection for cardinality
- Validation: Cardinality required for all fields

---

#### Modal 2: Primary Access Pattern

**Trigger**: Click "Set Primary Pattern" button

**Layout:**
```
┌─────────────────────────────────────────┐
│ Primary Access Pattern                  │
├─────────────────────────────────────────┤
│ Query Description:                      │
│ [Get all orders for a customer...]     │
│                                          │
│ Fields Used in Query:                   │
│ ☑ customer_id (Filter: Equality)        │
│ ☑ order_date (Sort: DESC)               │
│ ☐ status                                │
│                                          │
│ Filter Types:                           │
│ • Equality (=)                          │
│ • Range (> < BETWEEN)                   │
│ • IN clause                             │
│                                          │
│ Sort Fields:                            │
│ • order_date [DESC ▼]                   │
│                                          │
│ Query Frequency: [High ▼]              │
│                                          │
│ [Save] [Cancel]                         │
└─────────────────────────────────────────┘
```

**Validation:**
- At least one field must be selected
- Sort fields must be timestamp/numeric
- Description required

---

#### Modal 3: Secondary Access Patterns

**Trigger**: Click "Add Secondary Pattern" button

**Layout:**
```
┌─────────────────────────────────────────┐
│ Secondary Access Patterns               │
├─────────────────────────────────────────┤
│ Pattern 1: Search by status             │
│   Fields: status (Equality)             │
│   Frequency: Medium                     │
│   [Edit] [Delete]                       │
│                                          │
│ Pattern 2: Search by email              │
│   Fields: email (Equality)              │
│   Frequency: Low                        │
│   [Edit] [Delete]                       │
│                                          │
│ [+ Add New Pattern]                     │
│                                          │
│ [Save] [Cancel]                         │
└─────────────────────────────────────────┘
```

**Features:**
- List of existing patterns
- Add/Edit/Delete patterns
- Same field selection as primary pattern

---

#### Modal 4: Operational Constraints

**Trigger**: Click "Set Constraints" button

**Layout:**
```
┌─────────────────────────────────────────┐
│ Operational Constraints                 │
├─────────────────────────────────────────┤
│ Partition Size Expectation:             │
│ ○ Small (< 10MB)                        │
│ ● Medium (10-50MB)                      │
│ ○ Large (50-100MB)                      │
│                                          │
│ Query Volume:                           │
│ ● Read-heavy                            │
│ ○ Write-heavy                           │
│ ○ Balanced                              │
│                                          │
│ Multi-Tenant: ☑ Yes                     │
│ Tenant Field: [tenant_id ▼]            │
│                                          │
│ Time-Series Data: ☑ Yes                 │
│ Retention: [30 days ▼]                  │
│                                          │
│ TTL Required: ☐ No                      │
│ TTL Value: [seconds]                    │
│                                          │
│ [Save] [Cancel]                         │
└─────────────────────────────────────────┘
```

**Features:**
- Radio buttons for single-select options
- Checkboxes for boolean flags
- Conditional fields (show tenant field if multi-tenant checked)

---

### 3.4 Model Generation & Review

**After "Generate Model" Click:**

1. **System Applies Rules:**
   - Selects PK based on: high cardinality + primary pattern + stability
   - Selects CK based on: filter fields + sort fields + ordering rules
   - Selects Indexes based on: secondary patterns + fields not in PK/CK

2. **Display Results:**
   - Show recommended PK/CK/Index in entity row
   - Highlight fields in field table
   - Show warnings if rules violated

3. **Preview CQL:**
   - Generate CREATE TABLE statement
   - Generate CREATE INDEX statements
   - Show explanations for each decision

4. **User Override:**
   - Allow user to manually adjust PK/CK/Index
   - Mark overrides clearly
   - Re-validate after override

5. **Download:**
   - Export CQL script
   - Export JSON with model metadata
   - Export documentation

---

## 4. VALIDATION RULES

### 4.1 Required Before Generation

- [ ] CSV uploaded and parsed
- [ ] All fields have cardinality set
- [ ] Primary access pattern defined
- [ ] At least one field selected in primary pattern

### 4.2 Warnings (Can Proceed)

- [ ] No secondary patterns defined (may need indexes later)
- [ ] Constraints not set (using defaults)
- [ ] Low-cardinality field selected as PK candidate
- [ ] Mutable field selected as PK candidate
- [ ] Estimated partition size > 100MB

### 4.3 Errors (Cannot Proceed)

- [ ] No high-cardinality fields in primary pattern
- [ ] All primary pattern fields are low-cardinality
- [ ] Time field used as sole PK
- [ ] No fields selected in primary pattern

---

## 5. RULE APPLICATION LOGIC

### 5.1 Partition Key Selection

```python
def select_partition_key(fields, primary_pattern, annotations):
    """
    Select partition key based on rules:
    1. Must be in primary access pattern
    2. Must have high cardinality
    3. Must be stable (not mutable)
    4. Must not be time-based (unless bucketed)
    """
    candidates = []
    
    for field in primary_pattern['filter_fields']:
        if (annotations[field]['cardinality'] == 'High' and
            not annotations[field]['mutable'] and
            not annotations[field]['time_field']):
            candidates.append(field)
    
    if not candidates:
        # Fallback: high cardinality from pattern, even if mutable
        for field in primary_pattern['filter_fields']:
            if annotations[field]['cardinality'] == 'High':
                candidates.append(field)
    
    if not candidates:
        raise ValidationError("No suitable partition key found")
    
    # Prefer business keys
    business_keys = [f for f in candidates if annotations[f]['business_key']]
    if business_keys:
        return business_keys[0]
    
    return candidates[0]
```

### 5.2 Clustering Key Selection

```python
def select_clustering_keys(primary_pattern, pk, annotations):
    """
    Select clustering keys based on rules:
    1. Order: Equality filters → Range filters → Sort fields
    2. Must be in primary access pattern
    3. Must not be PK
    """
    ck = []
    
    # Equality filters first
    for field in primary_pattern['filter_fields']:
        if field != pk and primary_pattern['filter_types'][field] == 'Equality':
            ck.append(field)
    
    # Range filters second
    for field in primary_pattern['filter_fields']:
        if field != pk and primary_pattern['filter_types'][field] == 'Range':
            ck.append(field)
    
    # Sort fields last
    for field in primary_pattern['sort_fields']:
        if field != pk:
            ck.append(field)
    
    return ck
```

### 5.3 Index Selection

```python
def select_indexes(secondary_patterns, pk, ck, annotations):
    """
    Select indexes based on rules:
    1. Field used in secondary pattern
    2. Field not in PK/CK
    3. Field has acceptable cardinality
    """
    index_fields = []
    
    for pattern in secondary_patterns:
        for field in pattern['filter_fields']:
            if field not in [pk] + ck:
                # Check cardinality
                cardinality = annotations[field]['cardinality']
                if cardinality in ['High', 'Medium', 'Low']:
                    if field not in index_fields:
                        index_fields.append(field)
    
    return index_fields
```

---

## 6. CQL GENERATION

### 6.1 CREATE TABLE Statement

```sql
CREATE TABLE IF NOT EXISTS {table_name} (
    {all_fields_with_types},
    PRIMARY KEY (({partition_key}), {clustering_keys})
) WITH CLUSTERING ORDER BY ({clustering_order});
```

### 6.2 CREATE INDEX Statements

```sql
CREATE CUSTOM INDEX IF NOT EXISTS {index_name}
ON {table_name} ({field})
USING 'StorageAttachedIndex';
```

### 6.3 Additional Options

- TTL: `WITH default_time_to_live = {ttl_seconds}`
- Compaction: Based on query volume
- Compression: Based on data characteristics

---

## 7. SUMMARY

**Key Design Decisions:**

1. **Single Row Per Entity**: Keeps UI compact, uses modals for details
2. **Progressive Disclosure**: Show only what's needed at each step
3. **Visual Status Indicators**: Clear progress tracking
4. **Validation at Each Step**: Prevent errors early
5. **User Override Capability**: Allow expert users to adjust recommendations
6. **Comprehensive Data Collection**: All information needed for rule application

**Next Steps:**
1. Implement backend rule engine
2. Build frontend UI components
3. Create validation logic
4. Add CQL generation with explanations
5. Test with real-world examples

