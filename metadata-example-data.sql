-- =====================================================
-- ODP Metadata Example Data
-- Database: odpmetadata
-- Schema: metadata
-- Purpose: Insert example data for Data Catalog demonstration
-- =====================================================

SET search_path TO metadata;

-- =====================================================
-- Example 1: Cassandra Table with Data API (Read & Write)
-- =====================================================

-- Insert Environment
INSERT INTO metadata.environments (name, display_name, description, is_default) VALUES
('production', 'Production', 'Production environment', true),
('dev', 'Development', 'Development environment', false),
('uat', 'UAT', 'User Acceptance Testing environment', false),
('it', 'IT', 'IT Testing environment', false);

-- Insert Cluster for Production
INSERT INTO metadata.clusters (environment_id, car_id, cluster_name, hosting_data_center, work_load_type, node_status_code)
VALUES 
(1, 'CLUSTER-001', 'prod-cassandra-cluster', 'us-east-1', 'OLTP', 'active'),
(1, 'CLUSTER-002', 'prod-kafka-cluster', 'us-east-1', 'streaming', 'active'),
(1, 'CLUSTER-003', 'prod-spark-cluster', 'us-east-1', 'analytics', 'active');

-- Insert Cassandra Keyspace
INSERT INTO metadata.cassandra_keyspaces (cluster_id, environment_id, car_id, keyspace_name, replication_value, cluster_name)
VALUES 
(1, 1, 'KS-001', 'ecommerce', '{"class": "NetworkTopologyStrategy", "us-east-1": 3}', 'prod-cassandra-cluster');

-- Insert Cassandra Table: user_profiles (Example 1 - Read & Write via API)
INSERT INTO metadata.cassandra_tables (
    keyspace_id, cluster_id, environment_id, car_id, table_name, keyspace_name,
    business_line, product_line, system_of_origin_code,
    estimated_storage_volume, actual_storage_volume, estimated_tps, actual_tps,
    description
) VALUES (
    1, 1, 1, 'TBL-001', 'user_profiles', 'ecommerce',
    'E-Commerce', 'Customer Management', 'ECM-001',
    10737418240, 8589934592, 1000, 850,
    'Stores user profile information including preferences, settings, and account details'
);

-- Insert Columns for user_profiles
INSERT INTO metadata.cassandra_columns (
    table_id, column_name, element_data_type, field_order, 
    info_classification, is_pci, required, description
) VALUES
(1, 'user_id', 'uuid', 1, 'internal', false, true, 'Unique identifier for the user'),
(1, 'email', 'text', 2, 'pii', false, true, 'User email address'),
(1, 'first_name', 'text', 3, 'pii', false, false, 'User first name'),
(1, 'last_name', 'text', 4, 'pii', false, false, 'User last name'),
(1, 'preferences', 'map<text, text>', 5, 'internal', false, false, 'User preferences map'),
(1, 'created_at', 'timestamp', 6, 'internal', false, true, 'Account creation timestamp'),
(1, 'updated_at', 'timestamp', 7, 'internal', false, false, 'Last update timestamp');

-- Insert Data API: UserProfileAPI (Read & Write)
INSERT INTO metadata.data_apis (
    environment_id, api_name, api_description, api_operation_text,
    endpoint_name, endpoint_path,
    cluster_name, keyspace_name, table_list_text,
    postman_collection_text, postman_collection_json,
    data_owner_car_id, data_owner_car_name,
    owner_1_tech_name, owner_2_application_name,
    consumer_car_id, consumer_car_name,
    domain, subdomain,
    prod_support_assignment_group_name, system_table_classification_text,
    status_text, data_modeling_url,
    description
) VALUES (
    1, 'UserProfileAPI', 'API for managing user profiles', 'CRUD operations for user profiles',
    'user-profiles-api', '/api/v1/user-profiles',
    'prod-cassandra-cluster', 'ecommerce', 'user_profiles',
    '{"info":{"name":"User Profile API","schema":"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},"item":[{"name":"Get User Profile","request":{"method":"GET","url":"{{base_url}}/api/v1/user-profiles/:userId"}},{"name":"Create User Profile","request":{"method":"POST","url":"{{base_url}}/api/v1/user-profiles","body":{"mode":"raw","raw":"{\"email\":\"user@example.com\",\"first_name\":\"John\",\"last_name\":\"Doe\"}"}}}]}',
    '{"info":{"name":"User Profile API","schema":"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},"item":[{"name":"Get User Profile","request":{"method":"GET","url":"{{base_url}}/api/v1/user-profiles/:userId"}},{"name":"Create User Profile","request":{"method":"POST","url":"{{base_url}}/api/v1/user-profiles","body":{"mode":"raw","raw":"{\"email\":\"user@example.com\",\"first_name\":\"John\",\"last_name\":\"Doe\"}"}}},{"name":"Update User Profile","request":{"method":"PUT","url":"{{base_url}}/api/v1/user-profiles/:userId"}},{"name":"Delete User Profile","request":{"method":"DELETE","url":"{{base_url}}/api/v1/user-profiles/:userId"}}]}'::jsonb,
    'OWNER-001', 'E-Commerce Data Team',
    'John Smith', 'Customer Management Service',
    'CONSUMER-001', 'Web Application Team',
    'ecommerce', 'customer',
    'E-Commerce Support', 'operational',
    'active', 'https://data-modeling.example.com/user-profiles',
    'RESTful API providing full CRUD operations for user profiles. Supports both read and write operations directly to Cassandra.'
);

-- Insert API to Table mapping (Read & Write)
INSERT INTO metadata.data_api_table_mappings (api_id, table_name, keyspace_name, relationship_type)
VALUES (1, 'user_profiles', 'ecommerce', 'read_write');

-- =====================================================
-- Example 2: Cassandra Table with Data API (Read only) + Kafka + Spark (Write)
-- =====================================================

-- Insert Cassandra Table: order_events (Example 2 - Read via API, Write via Kafka/Spark)
INSERT INTO metadata.cassandra_tables (
    keyspace_id, cluster_id, environment_id, car_id, table_name, keyspace_name,
    business_line, product_line, system_of_origin_code,
    estimated_storage_volume, actual_storage_volume, estimated_tps, actual_tps,
    description
) VALUES (
    1, 1, 1, 'TBL-002', 'order_events', 'ecommerce',
    'E-Commerce', 'Order Management', 'ECM-002',
    53687091200, 42949672960, 5000, 4200,
    'Stores order event data for analytics and reporting. Data is written via Kafka and Spark streaming jobs.'
);

-- Insert Columns for order_events
INSERT INTO metadata.cassandra_columns (
    table_id, column_name, element_data_type, field_order,
    info_classification, is_pci, required, description
) VALUES
(2, 'event_id', 'uuid', 1, 'internal', false, true, 'Unique event identifier'),
(2, 'order_id', 'uuid', 2, 'internal', false, true, 'Order identifier'),
(2, 'user_id', 'uuid', 3, 'internal', false, true, 'User identifier'),
(2, 'event_type', 'text', 4, 'internal', false, true, 'Type of order event'),
(2, 'event_timestamp', 'timestamp', 5, 'internal', false, true, 'Event timestamp'),
(2, 'event_data', 'map<text, text>', 6, 'internal', false, false, 'Additional event data'),
(2, 'amount', 'decimal', 7, 'financial', false, false, 'Order amount'),
(2, 'currency', 'text', 8, 'internal', false, false, 'Currency code');

-- Insert Data API: OrderEventsReadAPI (Read only)
INSERT INTO metadata.data_apis (
    environment_id, api_name, api_description, api_operation_text,
    endpoint_name, endpoint_path,
    cluster_name, keyspace_name, table_list_text,
    postman_collection_text, postman_collection_json,
    data_owner_car_id, data_owner_car_name,
    owner_1_tech_name, owner_2_application_name,
    consumer_car_id, consumer_car_name,
    domain, subdomain,
    prod_support_assignment_group_name, system_table_classification_text,
    status_text, data_modeling_url,
    description
) VALUES (
    1, 'OrderEventsReadAPI', 'Read-only API for querying order events', 'Read operations only',
    'order-events-read-api', '/api/v1/order-events',
    'prod-cassandra-cluster', 'ecommerce', 'order_events',
    '{"info":{"name":"Order Events Read API","schema":"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},"item":[{"name":"Get Order Events","request":{"method":"GET","url":"{{base_url}}/api/v1/order-events?orderId=:orderId"}},{"name":"Get Events by User","request":{"method":"GET","url":"{{base_url}}/api/v1/order-events?userId=:userId"}}]}',
    '{"info":{"name":"Order Events Read API","schema":"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},"item":[{"name":"Get Order Events","request":{"method":"GET","url":"{{base_url}}/api/v1/order-events?orderId=:orderId"}},{"name":"Get Events by User","request":{"method":"GET","url":"{{base_url}}/api/v1/order-events?userId=:userId"}},{"name":"Get Events by Date Range","request":{"method":"GET","url":"{{base_url}}/api/v1/order-events?startDate=:startDate&endDate=:endDate"}}]}'::jsonb,
    'OWNER-002', 'Analytics Data Team',
    'Jane Doe', 'Analytics Service',
    'CONSUMER-002', 'Reporting Dashboard Team',
    'ecommerce', 'analytics',
    'Analytics Support', 'analytical',
    'active', 'https://data-modeling.example.com/order-events',
    'Read-only RESTful API for querying order events. Write operations are handled via Kafka and Spark streaming.'
);

-- Insert API to Table mapping (Read only)
INSERT INTO metadata.data_api_table_mappings (api_id, table_name, keyspace_name, relationship_type)
VALUES (2, 'order_events', 'ecommerce', 'read');

-- Insert Kafka Topic: order-events-topic
INSERT INTO metadata.kafka_topics (
    cluster_id, environment_id, car_id, topic_name, cluster_name,
    partition_count, replication_factor,
    business_line, product_line, system_of_origin_code,
    data_owner_car_id, data_owner_car_name,
    schema_registry_url, schema_name,
    description
) VALUES (
    2, 1, 'KAFKA-001', 'order-events-topic', 'prod-kafka-cluster',
    12, 3,
    'E-Commerce', 'Order Management', 'ECM-002',
    'OWNER-002', 'Analytics Data Team',
    'https://schema-registry.example.com', 'OrderEventSchema',
    'Kafka topic for order events. Consumed by Spark streaming job to write to Cassandra order_events table.'
);

-- Insert Spark Job: OrderEventsStreamingJob
INSERT INTO metadata.spark_jobs (
    environment_id, job_name, job_type, description,
    business_line, product_line, system_of_origin_code,
    data_owner_car_id, data_owner_car_name,
    owner_1_tech_name, spark_cluster_name, status_text
) VALUES (
    1, 'OrderEventsStreamingJob', 'streaming',
    'Spark streaming job that consumes order events from Kafka topic and writes to Cassandra order_events table. Processes events in real-time with exactly-once semantics.',
    'E-Commerce', 'Order Management', 'ECM-002',
    'OWNER-002', 'Analytics Data Team',
    'Mike Johnson', 'prod-spark-cluster', 'active'
);

-- =====================================================
-- Additional Example: Another Cassandra Table with Full Lineage
-- =====================================================

-- Insert Cassandra Table: product_catalog
INSERT INTO metadata.cassandra_tables (
    keyspace_id, cluster_id, environment_id, car_id, table_name, keyspace_name,
    business_line, product_line, system_of_origin_code,
    estimated_storage_volume, actual_storage_volume, estimated_tps, actual_tps,
    description
) VALUES (
    1, 1, 1, 'TBL-003', 'product_catalog', 'ecommerce',
    'E-Commerce', 'Product Management', 'ECM-003',
    21474836480, 17179869184, 2000, 1800,
    'Product catalog information including product details, pricing, and inventory'
);

-- Insert Data API: ProductCatalogAPI (Read & Write)
INSERT INTO metadata.data_apis (
    environment_id, api_name, api_description, api_operation_text,
    endpoint_name, endpoint_path,
    cluster_name, keyspace_name, table_list_text,
    postman_collection_json,
    data_owner_car_id, data_owner_car_name,
    owner_1_tech_name, owner_2_application_name,
    domain, subdomain,
    status_text,
    description
) VALUES (
    1, 'ProductCatalogAPI', 'API for managing product catalog', 'CRUD operations',
    'product-catalog-api', '/api/v1/products',
    'prod-cassandra-cluster', 'ecommerce', 'product_catalog',
    '{"info":{"name":"Product Catalog API"},"item":[{"name":"Get Product","request":{"method":"GET","url":"{{base_url}}/api/v1/products/:productId"}}]}'::jsonb,
    'OWNER-003', 'Product Management Team',
    'Sarah Williams', 'Product Service',
    'ecommerce', 'product',
    'active',
    'RESTful API for product catalog management'
);

INSERT INTO metadata.data_api_table_mappings (api_id, table_name, keyspace_name, relationship_type)
VALUES (3, 'product_catalog', 'ecommerce', 'read_write');

-- =====================================================
-- Create Components for Unified Search
-- =====================================================

-- Component for user_profiles table
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    cassandra_table_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'cassandra_table', 'table', 1,
    1, 'user_profiles', 'ecommerce.user_profiles', 'User Profiles',
    'Stores user profile information including preferences, settings, and account details',
    'TBL-001', 'E-Commerce', 'Customer Management', 'ECM-001',
    to_tsvector('english', 'user_profiles ecommerce customer management preferences settings account')
);

-- Component for UserProfileAPI
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    data_api_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'data_api', 'api', 1,
    1, 'UserProfileAPI', 'api/v1/user-profiles', 'User Profile API',
    'RESTful API providing full CRUD operations for user profiles',
    'API-001', 'E-Commerce', 'Customer Management', 'ECM-001',
    to_tsvector('english', 'UserProfileAPI user profiles CRUD RESTful API customer management')
);

-- Component for order_events table
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    cassandra_table_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'cassandra_table', 'table', 1,
    2, 'order_events', 'ecommerce.order_events', 'Order Events',
    'Stores order event data for analytics and reporting',
    'TBL-002', 'E-Commerce', 'Order Management', 'ECM-002',
    to_tsvector('english', 'order_events ecommerce analytics reporting order management')
);

-- Component for OrderEventsReadAPI
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    data_api_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'data_api', 'api', 1,
    2, 'OrderEventsReadAPI', 'api/v1/order-events', 'Order Events Read API',
    'Read-only RESTful API for querying order events',
    'API-002', 'E-Commerce', 'Order Management', 'ECM-002',
    to_tsvector('english', 'OrderEventsReadAPI order events read-only query analytics')
);

-- Component for order-events-topic
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    kafka_topic_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'kafka_topic', 'topic', 1,
    1, 'order-events-topic', 'kafka://order-events-topic', 'Order Events Topic',
    'Kafka topic for order events consumed by Spark streaming job',
    'KAFKA-001', 'E-Commerce', 'Order Management', 'ECM-002',
    to_tsvector('english', 'order-events-topic kafka streaming spark order events')
);

-- Component for OrderEventsStreamingJob
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    spark_job_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'spark_job', 'streaming', 1,
    1, 'OrderEventsStreamingJob', 'spark://OrderEventsStreamingJob', 'Order Events Streaming Job',
    'Spark streaming job that consumes order events from Kafka and writes to Cassandra',
    'SPARK-001', 'E-Commerce', 'Order Management', 'ECM-002',
    to_tsvector('english', 'OrderEventsStreamingJob spark streaming kafka cassandra order events')
);

-- Component for product_catalog table
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    cassandra_table_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'cassandra_table', 'table', 1,
    3, 'product_catalog', 'ecommerce.product_catalog', 'Product Catalog',
    'Product catalog information including product details, pricing, and inventory',
    'TBL-003', 'E-Commerce', 'Product Management', 'ECM-003',
    to_tsvector('english', 'product_catalog ecommerce product details pricing inventory')
);

-- Component for ProductCatalogAPI
INSERT INTO metadata.components (
    component_type, component_subtype, environment_id,
    data_api_id, name, fully_qualified_name, display_name,
    description, car_id, business_line, product_line, system_of_origin_code,
    search_vector
) VALUES (
    'data_api', 'api', 1,
    3, 'ProductCatalogAPI', 'api/v1/products', 'Product Catalog API',
    'RESTful API for product catalog management',
    'API-003', 'E-Commerce', 'Product Management', 'ECM-003',
    to_tsvector('english', 'ProductCatalogAPI product catalog RESTful API management')
);

-- =====================================================
-- Create Lineage Relationships
-- =====================================================

-- Example 1 Lineage: UserProfileAPI -> user_profiles (Read & Write)
INSERT INTO metadata.lineage_relationships (
    source_component_id, target_component_id, relationship_type, operation_type, description
) VALUES
-- API writes to table
((SELECT id FROM metadata.components WHERE name = 'UserProfileAPI'),
 (SELECT id FROM metadata.components WHERE name = 'user_profiles'),
 'write', 'api_write', 'UserProfileAPI writes user profile data to Cassandra table'),
-- API reads from table
((SELECT id FROM metadata.components WHERE name = 'UserProfileAPI'),
 (SELECT id FROM metadata.components WHERE name = 'user_profiles'),
 'read', 'api_read', 'UserProfileAPI reads user profile data from Cassandra table');

-- Example 2 Lineage: Kafka -> Spark -> Cassandra (Write path)
-- Kafka Topic -> Spark Job
INSERT INTO metadata.lineage_relationships (
    source_component_id, target_component_id, relationship_type, operation_type, description
) VALUES
((SELECT id FROM metadata.components WHERE name = 'order-events-topic'),
 (SELECT id FROM metadata.components WHERE name = 'OrderEventsStreamingJob'),
 'read', 'kafka_consume', 'Spark job consumes order events from Kafka topic');

-- Spark Job -> Cassandra Table
INSERT INTO metadata.lineage_relationships (
    source_component_id, target_component_id, relationship_type, operation_type, description
) VALUES
((SELECT id FROM metadata.components WHERE name = 'OrderEventsStreamingJob'),
 (SELECT id FROM metadata.components WHERE name = 'order_events'),
 'write', 'spark_write', 'Spark streaming job writes order events to Cassandra table');

-- Data API -> Cassandra Table (Read only)
INSERT INTO metadata.lineage_relationships (
    source_component_id, target_component_id, relationship_type, operation_type, description
) VALUES
((SELECT id FROM metadata.components WHERE name = 'OrderEventsReadAPI'),
 (SELECT id FROM metadata.components WHERE name = 'order_events'),
 'read', 'api_read', 'OrderEventsReadAPI reads order events from Cassandra table');

-- Example 3 Lineage: ProductCatalogAPI -> product_catalog (Read & Write)
INSERT INTO metadata.lineage_relationships (
    source_component_id, target_component_id, relationship_type, operation_type, description
) VALUES
((SELECT id FROM metadata.components WHERE name = 'ProductCatalogAPI'),
 (SELECT id FROM metadata.components WHERE name = 'product_catalog'),
 'write', 'api_write', 'ProductCatalogAPI writes product data to Cassandra table'),
((SELECT id FROM metadata.components WHERE name = 'ProductCatalogAPI'),
 (SELECT id FROM metadata.components WHERE name = 'product_catalog'),
 'read', 'api_read', 'ProductCatalogAPI reads product data from Cassandra table');

