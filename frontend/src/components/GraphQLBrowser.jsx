import React, { useState } from 'react'
import ResizablePanels from './ResizablePanels'
import GraphQLCollectionList from './GraphQLCollectionList'
import GraphQLRequestBar from './GraphQLRequestBar'
import GraphQLRequestTabs from './GraphQLRequestTabs'
import GraphQLResponse from './GraphQLResponse'
import './GraphQLBrowser.css'

const GraphQLBrowser = () => {
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [selectedQuery, setSelectedQuery] = useState(null)
  const [url, setUrl] = useState('https://api.example.com/graphql')
  const [query, setQuery] = useState('')
  const [variables, setVariables] = useState('')
  const [params, setParams] = useState([])
  const [headers, setHeaders] = useState([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  const [authorization, setAuthorization] = useState({
    type: 'No Auth',
    bearerToken: '',
    apiKey: { key: '', value: '', addTo: 'Header' },
    basicAuth: { username: '', password: '' }
  })
  const [activeTab, setActiveTab] = useState('body')
  const [queryResults, setQueryResults] = useState(null)
  const [executing, setExecuting] = useState(false)

  // Sample GraphQL collection data (can be replaced with API call later)
  const [collections] = useState([
    {
      id: 'collection-1',
      name: 'User Management',
      queries: [
        {
          id: 'query-1',
          name: 'Get All Users',
          query: `query GetAllUsers {
  users {
    id
    name
    email
    createdAt
  }
}`,
          variables: '{}',
          url: 'https://api.example.com/graphql'
        },
        {
          id: 'query-2',
          name: 'Get User by ID',
          query: `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    profile {
      bio
      avatar
    }
  }
}`,
          variables: '{\n  "id": "1"\n}',
          url: 'https://api.example.com/graphql'
        }
      ]
    },
    {
      id: 'collection-2',
      name: 'Product Catalog',
      queries: [
        {
          id: 'query-3',
          name: 'Get Products',
          query: `query GetProducts($limit: Int, $offset: Int) {
  products(limit: $limit, offset: $offset) {
    id
    name
    price
    description
    category {
      id
      name
    }
  }
}`,
          variables: '{\n  "limit": 10,\n  "offset": 0\n}',
          url: 'https://api.example.com/graphql'
        },
        {
          id: 'query-4',
          name: 'Search Products',
          query: `query SearchProducts($searchTerm: String!) {
  searchProducts(searchTerm: $searchTerm) {
    id
    name
    price
    description
  }
}`,
          variables: '{\n  "searchTerm": "laptop"\n}',
          url: 'https://api.example.com/graphql'
        }
      ]
    }
  ])

  const handleCollectionSelect = (collection) => {
    setSelectedCollection(collection)
    setSelectedQuery(null)
    setQuery('')
    setVariables('{}')
    setQueryResults(null)
  }

  const handleQuerySelect = (queryItem) => {
    setSelectedQuery(queryItem)
    setQuery(queryItem.query)
    setVariables(queryItem.variables || '{}')
    setUrl(queryItem.url || url)
    setQueryResults(null)
  }

  const handleExecute = async () => {
    if (!query.trim()) {
      alert('Please enter a GraphQL query')
      return
    }

    if (!url.trim()) {
      alert('Please enter a GraphQL endpoint URL')
      return
    }

    setExecuting(true)
    try {
      // Parse variables if provided
      let parsedVariables = {}
      if (variables.trim()) {
        try {
          parsedVariables = JSON.parse(variables)
        } catch (e) {
          alert('Invalid JSON in variables. Please check the format.')
          setExecuting(false)
          return
        }
      }

      // Build headers
      const requestHeaders = {
        'Content-Type': 'application/json'
      }

      // Add custom headers
      headers.forEach(header => {
        if (header.enabled && header.key) {
          requestHeaders[header.key] = header.value
        }
      })

      // Add authorization headers
      if (authorization.type === 'Bearer Token' && authorization.bearerToken) {
        requestHeaders['Authorization'] = `Bearer ${authorization.bearerToken}`
      } else if (authorization.type === 'API Key' && authorization.apiKey.key) {
        if (authorization.apiKey.addTo === 'Header') {
          requestHeaders[authorization.apiKey.key] = authorization.apiKey.value
        }
      } else if (authorization.type === 'Basic Auth' && authorization.basicAuth.username) {
        const credentials = btoa(`${authorization.basicAuth.username}:${authorization.basicAuth.password}`)
        requestHeaders['Authorization'] = `Basic ${credentials}`
      }

      // Build URL with params
      let requestUrl = url
      const enabledParams = params.filter(p => p.enabled && p.key)
      if (enabledParams.length > 0) {
        const queryString = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
        requestUrl += (requestUrl.includes('?') ? '&' : '?') + queryString
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          query: query,
          variables: parsedVariables
        })
      })

      const result = await response.json()
      setQueryResults({
        ...result,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
    } catch (error) {
      console.error('Error executing GraphQL query:', error)
      setQueryResults({
        data: null,
        errors: [{ message: error.message || 'Failed to execute query' }],
        status: 0,
        statusText: 'Error'
      })
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="graphql-browser">
      <div className="browser-top-section">
        <ResizablePanels>
          {/* Left Panel - GraphQL Collection List */}
          <div className="browser-sidebar">
            <div className="sidebar-header">
              <h3>GraphQL Collections</h3>
            </div>
            <GraphQLCollectionList
              collections={collections}
              selectedCollection={selectedCollection}
              selectedQuery={selectedQuery}
              onCollectionSelect={handleCollectionSelect}
              onQuerySelect={handleQuerySelect}
            />
          </div>

          {/* Center Panel - Request + Variables Combined */}
          <div className="browser-center">
            {/* Request Bar */}
            <GraphQLRequestBar
              url={url}
              onUrlChange={setUrl}
              onExecute={handleExecute}
              executing={executing}
            />

            {/* Request Tabs with Query and Variables */}
            <GraphQLRequestTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              query={query}
              onQueryChange={setQuery}
              variables={variables}
              onVariablesChange={setVariables}
              params={params}
              onParamsChange={setParams}
              headers={headers}
              onHeadersChange={setHeaders}
              authorization={authorization}
              onAuthorizationChange={setAuthorization}
            />
          </div>

          {/* Right Panel - Response */}
          <div className="browser-right">
            <GraphQLResponse
              results={queryResults}
              executing={executing}
            />
          </div>
        </ResizablePanels>
      </div>
    </div>
  )
}

export default GraphQLBrowser
