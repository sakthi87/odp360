import React, { useState, useEffect } from 'react'
import { 
  getEnvironments, 
  searchComponents, 
  getComponentDetails,
  getComponentLineage
} from '../services/datacatalogApi'
import apiIcon from '../assets/api-icon.png'
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
  
  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(15) // percentage
  const [centerPanelWidth, setCenterPanelWidth] = useState(35) // percentage
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingCenter, setIsResizingCenter] = useState(false)

  useEffect(() => {
    loadEnvironments()
  }, [])

  // Panel resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      const totalWidth = window.innerWidth
      
      if (isResizingLeft) {
        const newLeftWidth = (e.clientX / totalWidth) * 100
        if (newLeftWidth >= 10 && newLeftWidth <= 40) {
          setLeftPanelWidth(newLeftWidth)
        }
      } else if (isResizingCenter) {
        const leftWidthPx = (leftPanelWidth / 100) * totalWidth
        const resizeHandleWidth = 4 // resize handle width in pixels
        const mainPanelWidth = totalWidth - leftWidthPx - resizeHandleWidth
        const newCenterWidth = ((e.clientX - leftWidthPx - resizeHandleWidth) / mainPanelWidth) * 100
        if (newCenterWidth >= 20 && newCenterWidth <= 60) {
          setCenterPanelWidth(newCenterWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingCenter(false)
    }

    if (isResizingLeft || isResizingCenter) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingLeft, isResizingCenter, leftPanelWidth, centerPanelWidth])

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
        return '🗄️' // Using emoji - can be replaced with image if cassandra.png is added to assets
      case 'data_api':
        return <img src={apiIcon} alt="API" className="component-icon-image" />
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
        <div className="catalog-filters" style={{ width: `${leftPanelWidth}%` }}>
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
        
        {/* Resize handle between left and center */}
        <div 
          className="resize-handle resize-handle-vertical"
          onMouseDown={() => setIsResizingLeft(true)}
        />

        {/* Main Panel - Results and Details */}
        <div className="catalog-main">
          <div className="catalog-results-panel" style={{ flexBasis: `${centerPanelWidth}%`, flexShrink: 0 }}>
            <div className="catalog-results">
              {renderResultsContent()}
            </div>
          </div>
          
          {/* Resize handle between center and right */}
          <div 
            className="resize-handle resize-handle-vertical"
            onMouseDown={() => setIsResizingCenter(true)}
          />

          <div className="catalog-details-panel" style={{ flex: 1 }}>
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
                        <div className="lineage-unified-view">
                          {/* Show complete chain horizontally: Source → Current → Target → Target... */}
                          <div className="lineage-horizontal-chain">
                            {(() => {
                              // Filter to only direct relationships
                              // Upstream: relationships where current component is the TARGET
                              const directUpstream = (lineage.upstream || []).filter(rel => 
                                rel && rel.target && rel.target.id === selectedComponent.id
                              )
                              
                              // Downstream: relationships where current component is the SOURCE
                              const directDownstream = (lineage.downstream || []).filter(rel => 
                                rel && rel.source && rel.source.id === selectedComponent.id
                              )
                              
                              if (directUpstream.length === 0 && directDownstream.length === 0) {
                                return null
                              }
                              
                              // Build complete chain from all relationships (for multi-hop support)
                              const allRels = [
                                ...(lineage.upstream || []),
                                ...(lineage.downstream || [])
                              ]
                              
                              // Build maps for multi-hop traversal
                              const relsBySource = new Map()
                              const relsByTarget = new Map()
                              
                              allRels.forEach(rel => {
                                if (rel && rel.source && rel.target) {
                                  if (!relsBySource.has(rel.source.id)) {
                                    relsBySource.set(rel.source.id, [])
                                  }
                                  relsBySource.get(rel.source.id).push(rel)
                                  
                                  if (!relsByTarget.has(rel.target.id)) {
                                    relsByTarget.set(rel.target.id, [])
                                  }
                                  relsByTarget.get(rel.target.id).push(rel)
                                }
                              })
                              
                              // Check if this is a bidirectional relationship
                              // Only check DIRECT relationships - if the same component appears in both
                              // direct upstream (as source) and direct downstream (as target), it's bidirectional
                              const directUpstreamSourceIds = new Set(directUpstream.map(rel => rel && rel.source ? rel.source.id : null).filter(id => id !== null))
                              const directDownstreamTargetIds = new Set(directDownstream.map(rel => rel && rel.target ? rel.target.id : null).filter(id => id !== null))
                              const isBidirectional = [...directUpstreamSourceIds].some(id => directDownstreamTargetIds.has(id))
                              
                              // Also check: if we have exactly one upstream and one downstream, and they're the same component
                              // This is a clear bidirectional case (API ↔ Table)
                              const isSimpleBidirectional = directUpstream.length === 1 && 
                                                           directDownstream.length === 1 &&
                                                           directUpstream[0].source.id === directDownstream[0].target.id
                              
                              // Build upstream chain (backwards from current component)
                              const upstreamChain = []
                              const upstreamComponentIds = new Set()
                              const processedRels = new Set()
                              
                              // Start with direct upstream relationships
                              directUpstream.forEach(rel => {
                                if (rel && rel.source && !upstreamComponentIds.has(rel.source.id)) {
                                  upstreamChain.push(rel)
                                  upstreamComponentIds.add(rel.source.id)
                                  processedRels.add(rel.id)
                                }
                              })
                              
                              // Extend upstream chain backwards (multi-hop) - ONLY if NOT bidirectional
                              // For bidirectional cases, we only want direct relationships
                              // Use isSimpleBidirectional for stricter check (exact 1-to-1 match)
                              if (upstreamChain.length > 0 && !isSimpleBidirectional) {
                                let firstSourceId = upstreamChain[0].source.id
                                let depth = 0
                                while (relsByTarget.has(firstSourceId) && depth < 5) {
                                  const incomingRels = relsByTarget.get(firstSourceId)
                                  const nextRel = incomingRels.find(rel => 
                                    rel && rel.target && rel.target.id === firstSourceId &&
                                    !upstreamComponentIds.has(rel.source.id) &&
                                    !processedRels.has(rel.id) &&
                                    rel.source.id !== selectedComponent.id // Don't include self-references
                                  )
                                  if (!nextRel) break
                                  upstreamChain.unshift(nextRel)
                                  upstreamComponentIds.add(nextRel.source.id)
                                  processedRels.add(nextRel.id)
                                  firstSourceId = nextRel.source.id
                                  depth++
                                }
                              }
                              
                              // Build downstream chain (forwards from current component)
                              const downstreamChain = []
                              const downstreamComponentIds = new Set()
                              
                              // Start with direct downstream relationships
                              directDownstream.forEach(rel => {
                                if (rel && rel.target && !downstreamComponentIds.has(rel.target.id)) {
                                  downstreamChain.push(rel)
                                  downstreamComponentIds.add(rel.target.id)
                                  processedRels.add(rel.id)
                                }
                              })
                              
                              // Extend downstream chain forwards (multi-hop) - ONLY if NOT bidirectional
                              // For bidirectional cases, we only want direct relationships
                              // Use isSimpleBidirectional for stricter check (exact 1-to-1 match)
                              if (downstreamChain.length > 0 && !isSimpleBidirectional) {
                                let lastTargetId = downstreamChain[downstreamChain.length - 1].target.id
                                let depth = 0
                                while (relsBySource.has(lastTargetId) && depth < 5) {
                                  const nextRels = relsBySource.get(lastTargetId)
                                  const nextRel = nextRels.find(rel => 
                                    rel && !downstreamComponentIds.has(rel.target.id) &&
                                    !processedRels.has(rel.id) &&
                                    rel.target.id !== selectedComponent.id // Don't include self-references
                                  )
                                  if (!nextRel) break
                                  downstreamChain.push(nextRel)
                                  downstreamComponentIds.add(nextRel.target.id)
                                  processedRels.add(nextRel.id)
                                  lastTargetId = nextRel.target.id
                                  depth++
                                }
                              }
                              
                              // Separate downstream into unique and duplicate components
                              // Duplicates are components that appear in both upstream and downstream
                              const uniqueDownstream = downstreamChain.filter(rel => 
                                rel && rel.target && !upstreamComponentIds.has(rel.target.id)
                              )
                              const duplicateDownstream = downstreamChain.filter(rel => 
                                rel && rel.target && upstreamComponentIds.has(rel.target.id)
                              )
                              
                              // Render the chain
                              return (
                                <>
                                  {/* Upstream chain */}
                                  {upstreamChain.map((rel, idx) => (
                                    <React.Fragment key={`upstream-${idx}`}>
                                      <div className="lineage-component">
                                        <span className="lineage-icon">{getComponentIcon(rel.source.componentType)}</span>
                                        <span className="lineage-name">{rel.source.displayName || rel.source.name}</span>
                                        <span className="lineage-type">{getComponentTypeLabel(rel.source.componentType)}</span>
                                      </div>
                                      <div className="lineage-arrow-container">
                                        <span className="lineage-operation-label">
                                          [{rel.relationshipType === 'write' ? 'Write' : 'Read'}]
                                        </span>
                                        <div className="lineage-arrow-horizontal">
                                          <span className={`lineage-arrow-${rel.relationshipType}`}>→</span>
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                  
                                  {/* Current Component */}
                                  <div className="lineage-center-component">
                                    <span className="lineage-icon-large">{getComponentIcon(selectedComponent.componentType)}</span>
                                    <span className="lineage-name-large">{selectedComponent.displayName || selectedComponent.name}</span>
                                    <span className="lineage-type-large">{getComponentTypeLabel(selectedComponent.componentType)}</span>
                                  </div>
                                  
                                  {/* Downstream chain - show unique components first */}
                                  {uniqueDownstream.map((rel, idx) => (
                                    <React.Fragment key={`downstream-${idx}`}>
                                      <div className="lineage-arrow-container">
                                        <span className="lineage-operation-label">
                                          [{rel.relationshipType === 'write' ? 'Write' : 'Read'}]
                                        </span>
                                        <div className="lineage-arrow-horizontal">
                                          <span className={`lineage-arrow-${rel.relationshipType}`}>→</span>
                                        </div>
                                      </div>
                                      <div className="lineage-component">
                                        <span className="lineage-icon">{getComponentIcon(rel.target.componentType)}</span>
                                        <span className="lineage-name">{rel.target.displayName || rel.target.name}</span>
                                        <span className="lineage-type">{getComponentTypeLabel(rel.target.componentType)}</span>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                  
                                  {/* Show duplicate components on the right (same component as upstream) */}
                                  {/* For read operations, arrow should point left (←) */}
                                  {duplicateDownstream.map((rel, idx) => (
                                    <React.Fragment key={`duplicate-${idx}`}>
                                      <div className="lineage-arrow-container">
                                        <span className="lineage-operation-label">
                                          [{rel.relationshipType === 'write' ? 'Write' : 'Read'}]
                                        </span>
                                        <div className="lineage-arrow-horizontal">
                                          <span className={`lineage-arrow-${rel.relationshipType}`}>
                                            {rel.relationshipType === 'read' ? '←' : '→'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="lineage-component">
                                        <span className="lineage-icon">{getComponentIcon(rel.target.componentType)}</span>
                                        <span className="lineage-name">{rel.target.displayName || rel.target.name}</span>
                                        <span className="lineage-type">{getComponentTypeLabel(rel.target.componentType)}</span>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                </>
                              )
                            })()}
                          </div>
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

