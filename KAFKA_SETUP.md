# Setting Up Kafka Locally for Testing

## Quick Start

Run the setup script to start Kafka with sample topics and data:

```bash
./scripts/setup-kafka.sh
```

This script will:
1. Start Zookeeper container (port 2181)
2. Start Kafka container (port 9092)
3. Create topics matching your Cassandra tables:
   - `Customer`
   - `Customer_Address`
   - `Customer_Phone`
   - `Customer_Email`
4. Produce sample JSON messages to each topic

## Connection Details

When connecting via the UI, use:
- **Bootstrap Servers**: `localhost:9092`
- **Security Protocol**: `PLAINTEXT`
- **Username**: (leave empty)
- **Password**: (leave empty)

## Topics and Sample Data

### Customer Topic
Contains customer records with fields:
- `customer_id` (UUID)
- `first_name`
- `last_name`
- `date_of_birth`
- `created_at`
- `updated_at`

**Sample Messages**: 6 messages

### Customer_Address Topic
Contains customer address records with fields:
- `address_id` (UUID)
- `customer_id` (UUID)
- `street_address`
- `city`
- `state`
- `zip_code`
- `country`
- `is_primary` (boolean)

**Sample Messages**: 4 messages

### Customer_Phone Topic
Contains customer phone records with fields:
- `phone_id` (UUID)
- `customer_id` (UUID)
- `phone_number`
- `phone_type`
- `is_primary` (boolean)
- `is_verified` (boolean)

**Sample Messages**: 4 messages

### Customer_Email Topic
Contains customer email records with fields:
- `email_id` (UUID)
- `customer_id` (UUID)
- `email_address`
- `is_primary` (boolean)
- `is_verified` (boolean)
- `verified_at` (timestamp)

**Sample Messages**: 4 messages

## Managing Kafka Containers

### Stop Kafka:
```bash
docker stop kafka-test zookeeper-test
```

### Start Kafka (if already created):
```bash
docker start zookeeper-test
docker start kafka-test
```

### Remove Kafka (cleanup):
```bash
docker rm -f kafka-test zookeeper-test
```

### View Kafka Logs:
```bash
docker logs kafka-test
docker logs zookeeper-test
```

## Verifying Topics and Messages

### List all topics:
```bash
docker exec kafka-test kafka-topics --list --bootstrap-server localhost:9092
```

### View messages in a topic:
```bash
docker exec kafka-test kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic Customer \
  --from-beginning \
  --max-messages 10
```

### Check message count:
```bash
docker exec kafka-test kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic Customer \
  --time -1
```

## Producing More Messages

You can produce additional messages using:

```bash
docker exec -i kafka-test bash -c 'echo "YOUR_JSON_MESSAGE" | kafka-console-producer --bootstrap-server localhost:9092 --topic TOPIC_NAME'
```

Example:
```bash
docker exec -i kafka-test bash -c 'echo "{\"customer_id\":\"123\",\"first_name\":\"Test\"}" | kafka-console-producer --bootstrap-server localhost:9092 --topic Customer'
```

## Troubleshooting

### Kafka container not starting:
- Check if port 9092 is already in use: `lsof -i :9092`
- Check Zookeeper is running: `docker ps | grep zookeeper`
- View Kafka logs: `docker logs kafka-test`

### Cannot connect from UI:
- Ensure Kafka backend is running on port 8081
- Verify Kafka container is running: `docker ps | grep kafka`
- Test connection manually: `docker exec kafka-test kafka-topics --list --bootstrap-server localhost:9092`

