import React, { useState, useEffect } from 'react'
import { 
  getEnvironments, 
  searchComponents, 
  getComponentDetails,
  getComponentLineage
} from '../services/datacatalogApi'
import './DataCatalog.css'

const DataCatalog = () => {
  const [environments, setEnvironments] = useState([])
  const [selectedEnvironment, setSelectedEnvironment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [componentType, setComponentType] = useState('')
  const [components, setComponents] = useState([])
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [componentDetails, setComponentDetails] = useState(null)
  const [lineage, setLineage] = useState({ upstream: [], downstream: [] })
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview, schema, lineage
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [loadingEnvironments, setLoadingEnvironments] = useState(true)

  useEffect(() => {
    loadEnvironments()
  }, [])

  useEffect(() => {
    if (selectedEnvironment && hasSearched) {
      performSearch()
    }
  }, [selectedEnvironment, componentType])

  const loadEnvironments = async () => {
    setLoadingEnvironments(true)
    try {
      const envs = await getEnvironments()
      setEnvironments(envs)
      // Default to Production environment
      const defaultEnv = envs.find(e => e.isDefault) || envs.find(e => e.name === 'production') || envs[0]
      if (defaultEnv) {
        setSelectedEnvironment(defaultEnv.id)
      }
    } catch (error) {
      console.error('Error loading environments:', error)
      setEnvironments([]) // Set empty array on error
    } finally {
      setLoadingEnvironments(false)
    }
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setHasSearched(false)
      setComponents([])
      setSelectedComponent(null)
      setComponentDetails(null)
      return
    }
    setHasSearched(true)
    performSearch()
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
    }
  }

  const performSearch = async () => {
    if (!selectedEnvironment || !searchTerm.trim()) return
    
    setLoading(true)
    setSearchError(null)
    try {
      const results = await searchComponents(searchTerm.trim(), selectedEnvironment, componentType)
      setComponents(results)
      if (results.length === 0) {
        setSelectedComponent(null)
        setComponentDetails(null)
      }
    } catch (error) {
      console.error('Error searching components:', error)
      setSearchError('Unable to fetch components. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComponentSelect = async (component) => {
    setSelectedComponent(component)
    setActiveTab('overview')
    setLoadingDetails(true)
    
    try {
      const [details, lineageData] = await Promise.all([
        getComponentDetails(component.id),
        getComponentLineage(component.id)
      ])
      setComponentDetails(details)
      setLineage(lineageData)
    } catch (error) {
      console.error('Error loading component details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const getComponentIcon = (componentType) => {
    switch (componentType) {
      case 'cassandra_table':
        return '📊'
      case 'data_api':
        return '🔌'
      case 'kafka_topic':
        return '📨'
      case 'spark_job':
        return '⚡'
      case 'yugabyte_table':
        return '🗄️'
      default:
        return '📄'
    }
  }

  const getComponentTypeLabel = (componentType) => {
    switch (componentType) {
      case 'cassandra_table':
        return 'Cassandra Table'
      case 'data_api':
        return 'Data API'
      case 'kafka_topic':
        return 'Kafka Topic'
      case 'spark_job':
        return 'Spark Job'
      case 'yugabyte_table':
        return 'YugabyteDB Table'
      default:
        return componentType
    }
  }

  const renderResultsContent = () => {
    if (!hasSearched || !searchTerm.trim()) {
      return (
        <div className="no-results">
          <p>Enter a keyword and press Search to discover catalog entries.</p>
        </div>
      )
    }

    if (loading) {
      return <div className="loading">Searching...</div>
    }

    if (searchError) {
      return <div className="no-results error">{searchError}</div>
    }

    if (!components.length) {
      return <div className="no-results">No components found for “{searchTerm}”. Try refining your search.</div>
    }

    return (
      <div className="search-results">
        <p className="results-count">{components.length} result{components.length !== 1 ? 's' : ''}</p>
        {components.map((component) => (
          <div
            key={component.id}
            className={`result-item ${selectedComponent?.id === component.id ? 'selected' : ''}`}
            onClick={() => handleComponentSelect(component)}
          >
            <div className="result-title">
              {component.displayName || component.name}
            </div>
            <div className="result-meta">
              <span className="result-type">{getComponentTypeLabel(component.componentType)}</span>
              <span className="result-fqn">{component.fullyQualifiedName}</span>
              {component.environmentName && <span className="result-env">{component.environmentName}</span>}
            </div>
            {component.description && (
              <div className="result-snippet">{component.description}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="data-catalog">
      {/* Header with Search */}
      <div className="catalog-header">
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search components (e.g., user, order, API name)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button className="search-button" onClick={handleSearch}>Search</button>
        </div>
      </div>

      <div className="catalog-content">
        {/* Left Panel - Filters */}
        <div className="catalog-filters">
          <div className="filter-section">
            <h4>Environment</h4>
            <select
              value={selectedEnvironment || ''}
              onChange={(e) => setSelectedEnvironment(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingEnvironments}
            >
              {loadingEnvironments ? (
                <option value="">Loading...</option>
              ) : environments.length === 0 ? (
                <option value="">No environments available</option>
              ) : (
                <>
                  <option value="">Select environment</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>
                      {env.displayName} {env.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="filter-section">
            <h4>Component Type</h4>
            <select
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="cassandra_table">Cassandra Tables</option>
              <option value="yugabyte_table">YugabyteDB Tables</option>
              <option value="data_api">Data APIs</option>
              <option value="kafka_topic">Kafka Topics</option>
              <option value="spark_job">Spark Jobs</option>
            </select>
          </div>
        </div>

        {/* Main Panel - Results and Details */}
        <div className="catalog-main">
          <div className="catalog-results-panel">
            <div className="catalog-results">
              {renderResultsContent()}
            </div>
          </div>

          <div className="catalog-details-panel">
            <div className="catalog-details">
            {selectedComponent ? (
              <>
              <div className="details-header">
                <h2>
                  <span className="component-icon-large">{getComponentIcon(selectedComponent.componentType)}</span>
                  {selectedComponent.displayName || selectedComponent.name}
                </h2>
                <div className="details-tabs">
                  <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={activeTab === 'schema' ? 'active' : ''}
                    onClick={() => setActiveTab('schema')}
                  >
                    Schema
                  </button>
                  <button
                    className={activeTab === 'lineage' ? 'active' : ''}
                    onClick={() => setActiveTab('lineage')}
                  >
                    Lineage
                  </button>
                </div>
              </div>

                {loadingDetails ? (
                  <div className="loading">Loading details...</div>
                ) : (
                  <div className="details-content">
                  {activeTab === 'overview' && componentDetails && (
                    <div className="overview-tab">
                      <div className="detail-section">
                        <h3>Basic Information</h3>
                        <table className="details-table">
                          <tbody>
                            <tr>
                              <td>Name:</td>
                              <td>{componentDetails.component.name}</td>
                            </tr>
                            <tr>
                              <td>Fully Qualified Name:</td>
                              <td>{componentDetails.component.fullyQualifiedName}</td>
                            </tr>
                            <tr>
                              <td>Type:</td>
                              <td>{getComponentTypeLabel(componentDetails.component.componentType)}</td>
                            </tr>
                            <tr>
                              <td>Environment:</td>
                              <td>{componentDetails.component.environmentName}</td>
                            </tr>
                            {componentDetails.component.businessLine && (
                              <tr>
                                <td>Business Line:</td>
                                <td>{componentDetails.component.businessLine}</td>
                              </tr>
                            )}
                            {componentDetails.component.productLine && (
                              <tr>
                                <td>Product Line:</td>
                                <td>{componentDetails.component.productLine}</td>
                              </tr>
                            )}
                            {componentDetails.component.description && (
                              <tr>
                                <td>Description:</td>
                                <td>{componentDetails.component.description}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'schema' && componentDetails && (
                    <div className="schema-tab">
                      {componentDetails.schema && Object.keys(componentDetails.schema).length > 0 ? (
                        <div className="schema-content">
                          {componentDetails.schema.table && (
                            <div className="schema-section">
                              <h3>Table Information</h3>
                              <pre>{JSON.stringify(componentDetails.schema.table, null, 2)}</pre>
                            </div>
                          )}
                          {componentDetails.schema.columns && (
                            <div className="schema-section">
                              <h3>Columns</h3>
                              <table className="schema-table">
                                <thead>
                                  <tr>
                                    <th>Column Name</th>
                                    <th>Data Type</th>
                                    <th>Order</th>
                                    <th>Classification</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {componentDetails.schema.columns.map((col, idx) => (
                                    <tr key={idx}>
                                      <td>{col.column_name}</td>
                                      <td>{col.element_data_type}</td>
                                      <td>{col.field_order}</td>
                                      <td>{col.info_classification}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {componentDetails.schema.api && (
                            <div className="schema-section">
                              <h3>API Information</h3>
                              <pre>{JSON.stringify(componentDetails.schema.api, null, 2)}</pre>
                            </div>
                          )}
                          {componentDetails.schema.topic && (
                            <div className="schema-section">
                              <h3>Topic Information</h3>
                              <pre>{JSON.stringify(componentDetails.schema.topic, null, 2)}</pre>
                            </div>
                          )}
                          {componentDetails.schema.job && (
                            <div className="schema-section">
                              <h3>Job Information</h3>
                              <pre>{JSON.stringify(componentDetails.schema.job, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-schema">No schema information available</div>
                      )}
                    </div>
                  )}

                    {activeTab === 'lineage' && (
                      <div className="lineage-tab">
                        <div className="lineage-section">
                          <h3>Upstream (Sources)</h3>
                          {lineage.upstream && lineage.upstream.length > 0 ? (
                            <div className="lineage-list">
                              {lineage.upstream.map((rel, idx) => (
                                <div key={idx} className="lineage-item">
                                  <div className="lineage-source">
                                    <span className="lineage-icon">{getComponentIcon(rel.source.componentType)}</span>
                                    <span className="lineage-name">{rel.source.displayName || rel.source.name}</span>
                                    <span className="lineage-type">{getComponentTypeLabel(rel.source.componentType)}</span>
                                  </div>
                                  <div className="lineage-arrow">
                                    <span className={`lineage-arrow-${rel.relationshipType}`}>
                                      {rel.relationshipType === 'write' ? '→' : '⇢'}
                                    </span>
                                    <span className="lineage-operation">{rel.operationType}</span>
                                  </div>
                                  <div className="lineage-target">
                                    <span className="lineage-icon">{getComponentIcon(rel.target.componentType)}</span>
                                    <span className="lineage-name">{rel.target.displayName || rel.target.name}</span>
                                    <span className="lineage-type">{getComponentTypeLabel(rel.target.componentType)}</span>
                                  </div>
                                  {rel.description && (
                                    <div className="lineage-description">{rel.description}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-lineage">No upstream components</div>
                          )}
                        </div>

                        <div className="lineage-section">
                          <h3>Downstream (Targets)</h3>
                          {lineage.downstream && lineage.downstream.length > 0 ? (
                            <div className="lineage-list">
                              {lineage.downstream.map((rel, idx) => (
                                <div key={idx} className="lineage-item">
                                  <div className="lineage-source">
                                    <span className="lineage-icon">{getComponentIcon(rel.source.componentType)}</span>
                                    <span className="lineage-name">{rel.source.displayName || rel.source.name}</span>
                                    <span className="lineage-type">{getComponentTypeLabel(rel.source.componentType)}</span>
                                  </div>
                                  <div className="lineage-arrow">
                                    <span className={`lineage-arrow-${rel.relationshipType}`}>
                                      {rel.relationshipType === 'write' ? '→' : '⇢'}
                                    </span>
                                    <span className="lineage-operation">{rel.operationType}</span>
                                  </div>
                                  <div className="lineage-target">
                                    <span className="lineage-icon">{getComponentIcon(rel.target.componentType)}</span>
                                    <span className="lineage-name">{rel.target.displayName || rel.target.name}</span>
                                    <span className="lineage-type">{getComponentTypeLabel(rel.target.componentType)}</span>
                                  </div>
                                  {rel.description && (
                                    <div className="lineage-description">{rel.description}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-lineage">No downstream components</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="no-selection">
                <p>Select a component from the search results to view details</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataCatalog

