import React, { useState, useEffect } from 'react'
import './IntakeList.css'

const IntakeList = () => {
  const [intakes, setIntakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIntake, setSelectedIntake] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchIntakes()
  }, [])

  const fetchIntakes = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 3000) // 3 second timeout
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:8084/api/intake/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setIntakes(Array.isArray(data) ? data : [])
      } else {
        setError(`Failed to load intake forms (Status: ${response.status})`)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        setError('Request timed out. The backend may be waiting for database connection. Please start the database or wait a moment and try again.')
      } else if (err.message && err.message.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Please ensure the backend is running on port 8084.')
      } else {
        setError('Error loading intake forms: ' + (err.message || 'Unknown error'))
      }
      console.error('Error fetching intakes:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    } catch {
      return dateStr
    }
  }

  const handleRowClick = async (intakeId) => {
    try {
      const response = await fetch(`http://localhost:8084/api/intake/${intakeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedIntake(data)
        setShowDetailsModal(true)
      } else {
        alert('Failed to load intake details')
      }
    } catch (err) {
      alert('Error loading intake details: ' + err.message)
    }
  }

  const formatJson = (obj) => {
    if (!obj) return 'N/A'
    if (typeof obj === 'string') {
      try {
        return JSON.stringify(JSON.parse(obj), null, 2)
      } catch {
        return obj
      }
    }
    return JSON.stringify(obj, null, 2)
  }

  return (
    <div className="intake-list-container">
      <div className="intake-list-header">
        <h2>Intake Forms</h2>
        <button onClick={fetchIntakes} className="refresh-button" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading intake forms...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : intakes.length === 0 ? (
        <div className="no-intakes">No intake forms found. Submit a form from the ODP Intake tab to get started.</div>
      ) : (
        <div className="intake-table-container">
          <table className="intake-table">
            <thead>
              <tr>
                <th>Intake ID</th>
                <th>Project Name</th>
                <th>EDAI Req ID</th>
                <th>Domain</th>
                <th>Business Line</th>
                <th>Tech Owner</th>
                <th>Components</th>
                <th>Created At</th>
                <th>Cassandra</th>
                <th>API Details</th>
              </tr>
            </thead>
            <tbody>
              {intakes.map((intake) => (
                <tr key={intake.intakeId} onClick={() => handleRowClick(intake.intakeId)} className="clickable-row">
                  <td>{intake.intakeId || 'N/A'}</td>
                  <td>{intake.projectName || 'N/A'}</td>
                  <td>{intake.edaiReqId || 'N/A'}</td>
                  <td>{intake.domain || 'N/A'}</td>
                  <td>{intake.businessLine || 'N/A'}</td>
                  <td>{intake.techOwnerEmail || 'N/A'}</td>
                  <td>{intake.components || 'N/A'}</td>
                  <td>{formatDate(intake.createdAt)}</td>
                  <td>
                    <button 
                      className="detail-badge"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(intake.intakeId)
                      }}
                    >
                      View
                    </button>
                  </td>
                  <td>
                    <button 
                      className="detail-badge"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(intake.intakeId)
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedIntake && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Intake Details: {selectedIntake.intakeId}</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Cassandra Entities Section */}
              {selectedIntake.cassandraEntities && selectedIntake.cassandraEntities.length > 0 && (
                <div className="details-section">
                  <h3>Cassandra Entities ({selectedIntake.cassandraEntities.length})</h3>
                  {selectedIntake.cassandraEntities.map((entity, idx) => (
                    <div key={idx} className="entity-card">
                      <h4>{entity.entityName || `Entity ${idx + 1}`}</h4>
                      <div className="entity-details">
                        <div><strong>Description:</strong> {entity.entityDescription || 'N/A'}</div>
                        <div><strong>Keyspace:</strong> {entity.keyspace || 'N/A'}</div>
                        <div><strong>SOR of Data:</strong> {entity.sorOfData || 'N/A'}</div>
                        <div><strong>Retention:</strong> {entity.retention || 'N/A'}</div>
                        {entity.generatedCql && (
                          <div className="cql-section">
                            <strong>Generated CQL:</strong>
                            <pre className="cql-code">{entity.generatedCql}</pre>
                          </div>
                        )}
                        {entity.partitionKey && (
                          <div><strong>Partition Key:</strong> {Array.isArray(entity.partitionKey) ? entity.partitionKey.join(', ') : formatJson(entity.partitionKey)}</div>
                        )}
                        {entity.clusteringKeys && (
                          <div><strong>Clustering Keys:</strong> {formatJson(entity.clusteringKeys)}</div>
                        )}
                        {entity.indexes && (
                          <div><strong>Indexes:</strong> {formatJson(entity.indexes)}</div>
                        )}
                        {entity.warnings && Array.isArray(entity.warnings) && entity.warnings.length > 0 && (
                          <div className="warnings-section">
                            <strong>Warnings:</strong>
                            <ul>
                              {entity.warnings.map((warning, wIdx) => (
                                <li key={wIdx}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* API Details Section */}
              {selectedIntake.apiDetails && selectedIntake.apiDetails.length > 0 && (
                <div className="details-section">
                  <h3>API Details ({selectedIntake.apiDetails.length})</h3>
                  <div className="api-table-container">
                    <table className="api-table">
                      <thead>
                        <tr>
                          <th>Access Pattern</th>
                          <th>Description</th>
                          <th>Average TPS</th>
                          <th>Peak TPS</th>
                          <th>SLA (ms)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIntake.apiDetails.map((api) => (
                          <tr key={api.id}>
                            <td>{api.accessPattern || 'N/A'}</td>
                            <td>{api.description || 'N/A'}</td>
                            <td>{api.averageTPS || 'N/A'}</td>
                            <td>{api.peakTPS || 'N/A'}</td>
                            <td>{api.slaInMs || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntakeList

