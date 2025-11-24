// API service for Data Catalog
// This service layer abstracts the API calls to the Data Catalog backend

// Automatically detect API URL based on current hostname
function getApiBaseUrl() {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_DATACATALOG_API_BASE_URL) {
    console.log('Using Data Catalog API URL from environment:', import.meta.env.VITE_DATACATALOG_API_BASE_URL)
    return import.meta.env.VITE_DATACATALOG_API_BASE_URL
  }
  
  // Otherwise, detect from current window location
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = window.location.port
  
  // Data Catalog backend is on port 8083
  const backendPort = '8083'
  
  // Construct API URL
  const apiUrl = `${protocol}//${hostname}:${backendPort}/api`
  console.log('Auto-detected Data Catalog API URL:', apiUrl)
  return apiUrl
}

const API_BASE_URL = getApiBaseUrl()
console.log('Data Catalog API Base URL:', API_BASE_URL)

/**
 * Get all environments
 */
export const getEnvironments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/environments`)
    if (!response.ok) throw new Error('Failed to fetch environments')
    return await response.json()
  } catch (error) {
    console.error('Error fetching environments:', error)
    return []
  }
}

/**
 * Search components
 */
export const searchComponents = async (searchTerm, environmentId, componentType) => {
  try {
    const params = new URLSearchParams()
    if (searchTerm) params.append('q', searchTerm)
    if (environmentId) params.append('environmentId', environmentId)
    if (componentType) params.append('componentType', componentType)
    
    const response = await fetch(`${API_BASE_URL}/components/search?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to search components')
    return await response.json()
  } catch (error) {
    console.error('Error searching components:', error)
    return []
  }
}

/**
 * Get component details
 */
export const getComponentDetails = async (componentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/components/${componentId}`)
    if (!response.ok) throw new Error('Failed to fetch component details')
    return await response.json()
  } catch (error) {
    console.error('Error fetching component details:', error)
    throw error
  }
}

/**
 * Get component lineage
 */
export const getComponentLineage = async (componentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/components/${componentId}/lineage`)
    if (!response.ok) throw new Error('Failed to fetch component lineage')
    return await response.json()
  } catch (error) {
    console.error('Error fetching component lineage:', error)
    return { upstream: [], downstream: [] }
  }
}

