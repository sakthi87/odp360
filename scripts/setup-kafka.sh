#!/bin/bash

# Script to set up Kafka with topics matching Cassandra tables

# Check if containers already exist and remove them
if [ "$(docker ps -aq -f name=zookeeper-test)" ]; then
    echo "Removing existing Zookeeper container..."
    docker rm -f zookeeper-test
fi

if [ "$(docker ps -aq -f name=kafka-test)" ]; then
    echo "Removing existing Kafka container..."
    docker rm -f kafka-test
fi

echo "Starting Zookeeper container..."
docker run --name zookeeper-test \
  -p 2181:2181 \
  -e ZOOKEEPER_CLIENT_PORT=2181 \
  -e ZOOKEEPER_TICK_TIME=2000 \
  -d confluentinc/cp-zookeeper:7.4.0

echo "Waiting for Zookeeper to start (10 seconds)..."
sleep 10

echo "Starting Kafka container..."
docker run --name kafka-test \
  -p 9092:9092 \
  -e KAFKA_BROKER_ID=1 \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper-test:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  -e KAFKA_AUTO_CREATE_TOPICS_ENABLE=true \
  --link zookeeper-test \
  -d confluentinc/cp-kafka:7.4.0

echo "Waiting for Kafka to start (20 seconds)..."
sleep 20

echo "Creating topics matching Cassandra tables..."
# Create topics for each Cassandra table
docker exec kafka-test kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic Customer \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists 2>/dev/null || echo "Topic Customer already exists or created"

docker exec kafka-test kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic Customer_Address \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists 2>/dev/null || echo "Topic Customer_Address already exists or created"

docker exec kafka-test kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic Customer_Phone \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists 2>/dev/null || echo "Topic Customer_Phone already exists or created"

docker exec kafka-test kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic Customer_Email \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists 2>/dev/null || echo "Topic Customer_Email already exists or created"

echo "Verifying topics were created..."
docker exec kafka-test kafka-topics --list --bootstrap-server localhost:9092

echo ""
echo "Producing sample messages to topics..."

# Produce messages using a here-document approach
produce_message() {
    local topic=$1
    local message=$2
    echo "$message" | docker exec -i kafka-test kafka-console-producer --bootstrap-server localhost:9092 --topic "$topic" 2>/dev/null
}

# Produce messages to Customer topic
produce_message Customer '{"customer_id":"550e8400-e29b-41d4-a716-446655440001","first_name":"John","last_name":"Smith","date_of_birth":"1985-05-15","created_at":"2024-01-15T10:30:00Z","updated_at":"2024-01-15T10:30:00Z"}'
produce_message Customer '{"customer_id":"550e8400-e29b-41d4-a716-446655440002","first_name":"Jane","last_name":"Johnson","date_of_birth":"1990-08-22","created_at":"2024-01-16T11:20:00Z","updated_at":"2024-01-16T11:20:00Z"}'
produce_message Customer '{"customer_id":"550e8400-e29b-41d4-a716-446655440003","first_name":"Michael","last_name":"Williams","date_of_birth":"1988-12-10","created_at":"2024-01-17T09:15:00Z","updated_at":"2024-01-17T09:15:00Z"}'

# Produce messages to Customer_Address topic
produce_message Customer_Address '{"address_id":"660e8400-e29b-41d4-a716-446655440001","customer_id":"550e8400-e29b-41d4-a716-446655440001","street_address":"101 Main Street","city":"New York","state":"NY","zip_code":"10001","country":"USA","is_primary":true}'
produce_message Customer_Address '{"address_id":"660e8400-e29b-41d4-a716-446655440002","customer_id":"550e8400-e29b-41d4-a716-446655440002","street_address":"202 Park Avenue","city":"Los Angeles","state":"CA","zip_code":"90001","country":"USA","is_primary":true}'

# Produce messages to Customer_Phone topic
produce_message Customer_Phone '{"phone_id":"770e8400-e29b-41d4-a716-446655440001","customer_id":"550e8400-e29b-41d4-a716-446655440001","phone_number":"+1-555-0101-1001","phone_type":"Mobile","is_primary":true,"is_verified":true}'
produce_message Customer_Phone '{"phone_id":"770e8400-e29b-41d4-a716-446655440002","customer_id":"550e8400-e29b-41d4-a716-446655440002","phone_number":"+1-555-0202-2002","phone_type":"Home","is_primary":true,"is_verified":true}'

# Produce messages to Customer_Email topic
produce_message Customer_Email '{"email_id":"880e8400-e29b-41d4-a716-446655440001","customer_id":"550e8400-e29b-41d4-a716-446655440001","email_address":"john.smith@example.com","is_primary":true,"is_verified":true,"verified_at":"2024-01-15T10:35:00Z"}'
produce_message Customer_Email '{"email_id":"880e8400-e29b-41d4-a716-446655440002","customer_id":"550e8400-e29b-41d4-a716-446655440002","email_address":"jane.johnson@example.com","is_primary":true,"is_verified":true,"verified_at":"2024-01-16T11:25:00Z"}'

echo ""
echo "✅ Kafka is ready!"
echo "Connection details:"
echo "  Bootstrap Servers: localhost:9092"
echo "  Security Protocol: PLAINTEXT"
echo ""
echo "Topics created:"
echo "  - Customer"
echo "  - Customer_Address"
echo "  - Customer_Phone"
echo "  - Customer_Email"
echo ""
echo "You can now connect via the UI!"
