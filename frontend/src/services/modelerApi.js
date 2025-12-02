const BASE_URL = 'http://localhost:8084/api/modeler'

export async function generateModel(payload) {
  const response = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to generate Cassandra model')
  }

  return response.json()
}

