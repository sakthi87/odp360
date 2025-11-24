// Kafka API service - Separate microservice on port 8081
function getKafkaApiBaseUrl() {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_KAFKA_API_BASE_URL) {
    return import.meta.env.VITE_KAFKA_API_BASE_URL
  }
  
  // Otherwise, detect from current window location
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const kafkaPort = '8081' // Kafka API runs on port 8081 (different from Cassandra on 8080)
  
  const apiUrl = `${protocol}//${hostname}:${kafkaPort}/api`
  console.log('Kafka API Base URL:', apiUrl)
  return apiUrl
}

const API_BASE_URL = getKafkaApiBaseUrl()

/**
 * Test Kafka connection
 */
export const testKafkaConnection = async (connectionRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/kafka/clusters/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Connection test failed')
    }
    return data
  } catch (error) {
    console.error('Error testing Kafka connection:', error)
    throw error
  }
}

/**
 * Add Kafka cluster connection
 */
export const addKafkaConnection = async (connectionRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/kafka/clusters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add connection')
    }
    return data
  } catch (error) {
    console.error('Error adding Kafka connection:', error)
    throw error
  }
}

/**
 * Get all Kafka clusters
 */
export const getKafkaClusters = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/kafka/clusters`)
    if (!response.ok) {
      throw new Error('Failed to fetch clusters')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching Kafka clusters:', error)
    throw error
  }
}

/**
 * Remove Kafka cluster
 */
export const removeKafkaCluster = async (clusterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/kafka/clusters/${clusterId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to remove cluster')
    }
    return true
  } catch (error) {
    console.error('Error removing Kafka cluster:', error)
    throw error
  }
}

/**
 * List topics for a cluster
 */
export const getKafkaTopics = async (clusterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/kafka/clusters/${clusterId}/topics`)
    if (!response.ok) {
      throw new Error('Failed to fetch topics')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching Kafka topics:', error)
    throw error
  }
}

/**
 * Get topic details
 */
export const getKafkaTopicDetails = async (clusterId, topicName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/kafka/clusters/${clusterId}/topics/${topicName}`)
    if (!response.ok) {
      throw new Error('Failed to fetch topic details')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching topic details:', error)
    throw error
  }
}

/**
 * Consume messages from a topic
 */
export const consumeKafkaMessages = async (clusterId, topicName, consumeRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/kafka/clusters/${clusterId}/topics/${topicName}/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consumeRequest),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to consume messages' }))
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to consume messages`)
    }
    const data = await response.json()
    console.log('Consumed messages:', data)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error consuming messages:', error)
    throw error
  }
}

