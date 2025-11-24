# Kafka Browser API

Separate microservice for Kafka operations.

## Port
- **8081** (different from Cassandra API which runs on 8080)

## Endpoints
- `GET /` - API info
- `GET /health` - Health check
- `GET /api/health` - API health check
- `POST /api/kafka/clusters/test-connection` - Test Kafka connection
- `POST /api/kafka/clusters` - Add Kafka cluster
- `GET /api/kafka/clusters` - List all clusters
- `DELETE /api/kafka/clusters/{clusterId}` - Remove cluster
- `GET /api/kafka/clusters/{clusterId}/topics` - List topics
- `GET /api/kafka/clusters/{clusterId}/topics/{topicName}` - Get topic details
- `POST /api/kafka/clusters/{clusterId}/topics/{topicName}/consume` - Consume messages

## Running

### Development
```bash
cd backend-kafka
./mvnw spring-boot:run
```

### Production
```bash
cd backend-kafka
./mvnw package
java -jar target/kafka-browser-api-1.0.0.jar
```

## Docker
```bash
docker build -t kafka-browser-api .
docker run -p 8081:8081 kafka-browser-api
```

