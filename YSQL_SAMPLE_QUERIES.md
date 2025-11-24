# YSQL Sample Queries

This document contains sample SQL queries for testing the YSQL browser functionality in the Online Data Platform.

## Table Structure

The sample database (`testdb`) contains the following tables:

- **users**: `id`, `name`, `email`
- **orders**: `id`, `customer_name`, `customer_email`, `total_amount`
- **order_items**: `id`, `order_id`, `product_id`, `quantity`
- **products**: `id`, `name`, `description`, `price`

## Sample JOIN Queries

### 1. Simple JOIN - Orders with Order Items

Get all orders with their associated order items.

```sql
SELECT 
    o.id AS order_id,
    o.customer_name,
    o.total_amount,
    oi.quantity,
    oi.product_id
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.id
LIMIT 20;
```

### 2. Multi-table JOIN - Orders, Order Items, and Products

Get complete order details including product information.

```sql
SELECT 
    o.id AS order_id,
    o.customer_name,
    o.customer_email,
    o.total_amount,
    p.name AS product_name,
    p.price,
    oi.quantity,
    (p.price * oi.quantity) AS line_total
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
ORDER BY o.id, p.name
LIMIT 20;
```

### 3. LEFT JOIN - All Orders with their Items (if any)

Get all orders, including those without order items.

```sql
SELECT 
    o.id AS order_id,
    o.customer_name,
    o.total_amount,
    oi.product_id,
    oi.quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.id
LIMIT 20;
```

### 4. Aggregated JOIN - Order Summary with Product Count

Get order summaries with aggregated item information.

```sql
SELECT 
    o.id AS order_id,
    o.customer_name,
    o.total_amount,
    COUNT(oi.id) AS item_count,
    SUM(oi.quantity) AS total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name, o.total_amount
ORDER BY o.id
LIMIT 20;
```

### 5. Complex JOIN - Full Order Details with Product Information

Get comprehensive order details with product information and calculated line totals.

```sql
SELECT 
    o.id AS order_id,
    o.customer_name,
    o.customer_email,
    o.total_amount AS order_total,
    p.name AS product_name,
    p.description,
    p.price AS unit_price,
    oi.quantity,
    (p.price * oi.quantity) AS line_total
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.total_amount > 0
ORDER BY o.id, p.name
LIMIT 20;
```

## Basic SELECT Queries

### 6. Select All Records from a Table

```sql
SELECT * FROM users LIMIT 10;
```

```sql
SELECT * FROM products LIMIT 10;
```

```sql
SELECT * FROM orders LIMIT 10;
```

```sql
SELECT * FROM order_items LIMIT 10;
```

### 7. Filtered Queries

```sql
SELECT * FROM orders WHERE total_amount > 100 ORDER BY total_amount DESC LIMIT 10;
```

```sql
SELECT * FROM products WHERE price < 50 ORDER BY price ASC LIMIT 10;
```

```sql
SELECT * FROM order_items WHERE quantity > 2 ORDER BY quantity DESC LIMIT 10;
```

## Aggregate Queries

### 8. Count Records

```sql
SELECT COUNT(*) AS total_orders FROM orders;
```

```sql
SELECT COUNT(*) AS total_products FROM products;
```

### 9. Sum and Average

```sql
SELECT 
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS average_order_value,
    COUNT(*) AS order_count
FROM orders;
```

```sql
SELECT 
    product_id,
    SUM(quantity) AS total_quantity_sold,
    COUNT(*) AS order_count
FROM order_items
GROUP BY product_id
ORDER BY total_quantity_sold DESC
LIMIT 10;
```

## How to Use These Queries

1. Open the Online Data Platform at **http://localhost:5173**
2. Navigate to the **YSQL** tab
3. Select any table from the left panel (e.g., `orders`, `products`, etc.)
4. In the Query Builder panel, replace the default query with one of the queries above
5. Click the **Execute** button to run the query
6. View the results in the bottom panel

## Notes

- All queries are limited to 20 rows by default (or as specified) to prevent large result sets
- The backend supports standard PostgreSQL/YSQL syntax
- Only SELECT queries are allowed (INSERT, UPDATE, DELETE are not supported through the query interface)
- JOIN queries work across all tables in the same database

