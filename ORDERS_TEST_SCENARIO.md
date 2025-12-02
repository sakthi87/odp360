# Orders Table - Test Scenario

## CSV File
Use: `sample-orders-schema.csv`

## Fields Available
- `order_id` (UUID)
- `user_id` (UUID)
- `order_date` (TIMESTAMP)
- `total_amount` (DECIMAL)
- `status` (TEXT)
- `shipping_address` (TEXT)
- `created_at` (TIMESTAMP)

---

## Step-by-Step Test Configuration

### 1. Query Access Patterns (Add 3-4 patterns)

#### Pattern 1: Get Order by Order ID
- **Query Description**: `Get order by order_id`
- **Pick Fields (for query)**: Check `order_id`
- **Response Fields**: Check all fields (`order_id`, `user_id`, `order_date`, `total_amount`, `status`, `shipping_address`, `created_at`)
- **Max. No Of Records**: `1`

#### Pattern 2: Get Orders by User ID
- **Query Description**: `Get all orders for a user by user_id`
- **Pick Fields (for query)**: Check `user_id`
- **Response Fields**: Check all fields
- **Max. No Of Records**: `100`

#### Pattern 3: Get Orders by User ID and Date Range
- **Query Description**: `Get orders for a user within date range`
- **Pick Fields (for query)**: Check `user_id` and `order_date`
- **Response Fields**: Check all fields
- **Max. No Of Records**: `50`

#### Pattern 4: Get Orders by Status
- **Query Description**: `Get orders filtered by status`
- **Pick Fields (for query)**: Check `status`
- **Response Fields**: Check all fields
- **Max. No Of Records**: `200`

---

### 2. Uniqueness Constraints (Add 1-2 constraints)

#### Uniqueness 1: Order ID (Primary Key)
- **Fields to Check**: `order_id`
- **Purpose**: Each order must have a unique order_id
- **Result**: This will set `order_id` as the Primary Key (PK)

#### Uniqueness 2: User ID + Order Date (Optional - Composite Unique)
- **Fields to Check**: `user_id` and `order_date`
- **Purpose**: Prevent duplicate orders for same user on same day
- **Note**: This is optional - you can test with just the first uniqueness

---

### 3. Expected Results

After making the selections above:

#### Primary Key (PK):
- Should show: `order_id`
- (Auto-populated from first uniqueness constraint)

#### Clustering Keys (CK):
- Should show: `order_date`
- (Auto-populated because `order_date` is a TIMESTAMP field selected in query patterns)

---

## Alternative Test Scenario (Composite Primary Key)

If you want to test with a composite primary key structure:

### Uniqueness 1: User ID + Order Date
- **Fields to Check**: `user_id` and `order_date`
- **Result**: PK becomes `user_id, order_date`

### Query Patterns:
- Keep Pattern 2 and Pattern 3 from above
- This structure allows querying by user_id and ordering by order_date

### Expected Results:
- **Primary Key (PK)**: `user_id, order_date`
- **Clustering Keys (CK)**: (empty, since order_date is already in PK)

---

## Recommended Test Flow

**Start with the first scenario** (order_id as PK):
1. Upload `sample-orders-schema.csv`
2. Add 4 Query Access Patterns (as described above)
3. Add 1 Uniqueness constraint with `order_id` checked
4. Review that PK = `order_id` and CK = `order_date`
5. Submit the form

This will test:
- ✅ Multiple query patterns
- ✅ Field selection via checkboxes
- ✅ Uniqueness selection
- ✅ Auto-population of PK/CK
- ✅ Form submission with all data

---

## What to Verify

1. ✅ After CSV upload, all 7 fields appear in checkboxes
2. ✅ Can select different fields for each query pattern
3. ✅ Can select response fields separately
4. ✅ Uniqueness checkboxes work independently
5. ✅ PK auto-populates when you check fields in Uniqueness
6. ✅ CK auto-populates when you select timestamp fields in query patterns
7. ✅ Can manually edit PK/CK fields if needed
8. ✅ Form submits successfully with all selections

