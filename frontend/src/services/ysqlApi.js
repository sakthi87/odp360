// API service for fetching data from YugabyteDB YSQL clusters
// This service layer abstracts the API calls to your backend

// Automatically detect API URL based on current hostname
function getApiBaseUrl() {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_YSQL_API_BASE_URL) {
    console.log('Using YSQL API URL from environment:', import.meta.env.VITE_YSQL_API_BASE_URL)
    return import.meta.env.VITE_YSQL_API_BASE_URL
  }
  
  // Otherwise, detect from current window location
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = window.location.port
  
  // YSQL backend is on port 8082
  const backendPort = '8082'
  
  // Construct API URL
  const apiUrl = `${protocol}//${hostname}:${backendPort}/api`
  console.log('Auto-detected YSQL API URL:', apiUrl)
  return apiUrl
}

const API_BASE_URL = getApiBaseUrl()
console.log('YSQL API Base URL:', API_BASE_URL)

/**
 * Test connection to YugabyteDB cluster
 */
export const testConnection = async (connectionRequest) => {
  try {
    const url = `${API_BASE_URL}/clusters/test-connection`
    console.log('Testing YSQL connection to:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` }
      }
      return { success: false, message: errorData.message || `Connection failed: ${response.status} ${response.statusText}` }
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Network error testing YSQL connection:', error)
    return { 
      success: false, 
      message: `Network error: ${error.message || `Failed to connect to backend. Please check if backend is running on ${API_BASE_URL.replace('/api', '')}`}` 
    }
  }
}

/**
 * Add/register a new cluster connection
 */
export const addConnection = async (connectionRequest) => {
  try {
    const url = `${API_BASE_URL}/clusters`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` }
      }
      throw new Error(errorData.message || `Failed to add connection: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error adding YSQL connection:', error)
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please check:\n- Backend is running on port 8081\n- Backend is accessible from this hostname\n- No firewall blocking the connection`)
    }
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
    console.error('Error fetching YSQL clusters:', error)
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
    console.error('Error removing YSQL connection:', error)
    return false
  }
}

/**
 * Fetch databases for a cluster
 */
export const getDatabases = async (clusterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/databases`)
    if (!response.ok) throw new Error(`Failed to fetch databases for cluster ${clusterId}`)
    return await response.json()
  } catch (error) {
    console.error(`Error fetching databases for cluster ${clusterId}:`, error)
    throw error
  }
}

/**
 * Fetch tables for a database in a cluster
 */
export const getTables = async (clusterId, databaseName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/databases/${databaseName}/tables`
    )
    if (!response.ok) throw new Error(`Failed to fetch tables for ${databaseName}`)
    return await response.json()
  } catch (error) {
    console.error(`Error fetching tables for ${databaseName}:`, error)
    throw error
  }
}

/**
 * Fetch table details (schema, columns, etc.)
 */
export const getTableDetails = async (clusterId, databaseName, tableName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/databases/${databaseName}/tables/${tableName}`
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
export const getTableRecords = async (clusterId, databaseName, tableName, limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/databases/${databaseName}/tables/${tableName}/records?limit=${limit}`
    )
    if (!response.ok) throw new Error(`Failed to fetch records from ${tableName}`)
    const data = await response.json()
    return data.rows || []
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error)
    throw error
  }
}

/**
 * Execute a custom SQL query
 */
export const executeQuery = async (clusterId, databaseName, query) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/clusters/${clusterId}/databases/${databaseName}/execute`,
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
    console.error('Error executing YSQL query:', error)
    throw error
  }
}

