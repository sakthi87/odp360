// API service for fetching data from Cassandra clusters
// This service layer abstracts the API calls to your backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

/**
 * Test connection to Cassandra cluster
 */
export const testConnection = async (connectionRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clusters/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    const data = await response.json()
    if (!response.ok) {
      return { success: false, message: data.message || 'Connection failed' }
    }
    return data
  } catch (error) {
    return { success: false, message: error.message || 'Failed to test connection' }
  }
}

/**
 * Add/register a new cluster connection
 */
export const addConnection = async (connectionRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clusters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add connection')
    }
    return await response.json()
  } catch (error) {
    console.error('Error adding connection:', error)
    throw error
  }
}

/**
 * Get all connected clusters
 */
export const getClusters = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/clusters`)
    if (!response.ok) throw new Error('Failed to fetch clusters')
    return await response.json()
  } catch (error) {
    console.error('Error fetching clusters:', error)
    return []
  }
}

/**
 * Remove a cluster connection
 */
export const removeConnection = async (clusterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}`, {
      method: 'DELETE',
    })
    return response.ok
  } catch (error) {
    console.error('Error removing connection:', error)
    return false
  }
}

/**
 * Fetch keyspaces for a cluster
 */
export const getKeyspaces = async (clusterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/keyspaces`)
    if (!response.ok) throw new Error(`Failed to fetch keyspaces for cluster ${clusterId}`)
    return await response.json()
  } catch (error) {
    console.error(`Error fetching keyspaces for cluster ${clusterId}:`, error)
    throw error
  }
}

/**
 * Fetch tables for a keyspace in a cluster
 */
export const getTables = async (clusterId, keyspaceName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/keyspaces/${keyspaceName}/tables`
    )
    if (!response.ok) throw new Error(`Failed to fetch tables for ${keyspaceName}`)
    return await response.json()
  } catch (error) {
    console.error(`Error fetching tables for ${keyspaceName}:`, error)
    throw error
  }
}

/**
 * Fetch table details (schema, columns, etc.)
 */
export const getTableDetails = async (clusterId, keyspaceName, tableName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/keyspaces/${keyspaceName}/tables/${tableName}`
    )
    if (!response.ok) throw new Error(`Failed to fetch table details for ${tableName}`)
    return await response.json()
  } catch (error) {
    console.error(`Error fetching table details for ${tableName}:`, error)
    throw error
  }
}

/**
 * Fetch top N records from a table
 */
export const getTableRecords = async (clusterId, keyspaceName, tableName, limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/keyspaces/${keyspaceName}/tables/${tableName}/records?limit=${limit}`
    )
    if (!response.ok) throw new Error(`Failed to fetch records from ${tableName}`)
    const data = await response.json()
    // Backend returns QueryResponse with rows array
    return data.rows || []
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error)
    throw error
  }
}

/**
 * Execute a custom CQL query
 */
export const executeQuery = async (clusterId, keyspaceName, query) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/keyspaces/${keyspaceName}/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }
    )
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Query execution failed')
    }
    return data
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}
