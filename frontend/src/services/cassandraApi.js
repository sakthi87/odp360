// API service for fetching data from Cassandra clusters
// This service layer abstracts the API calls to your backend

// Automatically detect API URL based on current hostname
// This allows the UI to work on any VM without hardcoding localhost
function getApiBaseUrl() {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('Using API URL from environment:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Otherwise, detect from current window location
  const protocol = window.location.protocol // http: or https:
  const hostname = window.location.hostname // localhost, VM hostname, or IP
  const port = window.location.port // Current port (if any)
  
  // Backend is always on port 8080, regardless of frontend port
  // If frontend is on 80/443, backend is on 8080
  // If frontend is on other port (like 5173), backend is still on 8080
  const backendPort = '8080'
  
  // Construct API URL
  const apiUrl = `${protocol}//${hostname}:${backendPort}/api`
  console.log('Auto-detected API URL:', apiUrl, '(from', window.location.href, ')')
  return apiUrl
}

const API_BASE_URL = getApiBaseUrl()
console.log('API Base URL:', API_BASE_URL)

/**
 * Test connection to Cassandra cluster
 */
export const testConnection = async (connectionRequest) => {
  try {
    const url = `${API_BASE_URL}/clusters/test-connection`
    console.log('Testing connection to:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    
    console.log('Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Connection test failed:', response.status, errorText)
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
    console.error('Network error testing connection:', error)
    return { 
      success: false, 
      message: `Network error: ${error.message || 'Failed to connect to backend. Please check if backend is running on ${API_BASE_URL.replace('/api', '')}` 
    }
  }
}

/**
 * Add/register a new cluster connection
 */
export const addConnection = async (connectionRequest) => {
  try {
    const url = `${API_BASE_URL}/clusters`
    console.log('Adding connection to:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionRequest),
    })
    
    console.log('Add connection response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Add connection failed:', response.status, errorText)
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
    console.error('Error adding connection:', error)
    // Provide more helpful error message
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please check:\n- Backend is running on port 8080\n- Backend is accessible from this hostname\n- No firewall blocking the connection`)
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
