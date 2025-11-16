import React, { useState } from 'react'
import './ConnectionDialog.css'

const ConnectionDialog = ({ open, onClose, onTest, onConnect, testing, connecting }) => {
  const [formData, setFormData] = useState({
    name: '',
    hosts: 'localhost:9042',
    datacenter: 'datacenter1',
    username: '',
    password: '',
    keyspace: ''
  })
  const [testResult, setTestResult] = useState(null)

  if (!open) return null

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setTestResult(null)
  }

  const handleTest = async () => {
    const hosts = formData.hosts.split(',').map(h => h.trim())
    const result = await onTest({
      name: formData.name || 'Untitled Connection',
      hosts,
      datacenter: formData.datacenter,
      username: formData.username || null,
      password: formData.password || null,
      keyspace: formData.keyspace || null
    })
    setTestResult(result)
  }

  const handleConnect = async () => {
    if (!testResult || !testResult.success) {
      alert('Please test connection first')
      return
    }

    const hosts = formData.hosts.split(',').map(h => h.trim())
    await onConnect({
      name: formData.name || 'Untitled Connection',
      hosts,
      datacenter: formData.datacenter,
      username: formData.username || null,
      password: formData.password || null,
      keyspace: formData.keyspace || null
    })
    
    // Reset form
    setFormData({
      name: '',
      hosts: 'localhost:9042',
      datacenter: 'datacenter1',
      username: '',
      password: '',
      keyspace: ''
    })
    setTestResult(null)
    onClose()
  }

  return (
    <div className="connection-dialog-overlay" onClick={onClose}>
      <div className="connection-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Connect to Cassandra</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-content">
          <div className="form-group">
            <label>Connection Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Dev Cluster"
            />
          </div>

          <div className="form-group">
            <label>Host(s) <span className="required">*</span></label>
            <input
              type="text"
              name="hosts"
              value={formData.hosts}
              onChange={handleChange}
              placeholder="localhost:9042 or host1:9042,host2:9042"
              required
            />
            <small>Comma-separated for multiple hosts</small>
          </div>

          <div className="form-group">
            <label>Datacenter <span className="required">*</span></label>
            <input
              type="text"
              name="datacenter"
              value={formData.datacenter}
              onChange={handleChange}
              placeholder="datacenter1"
              required
            />
          </div>

          <div className="form-group">
            <label>Username (optional)</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="cassandra"
            />
          </div>

          <div className="form-group">
            <label>Password (optional)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>Default Keyspace (optional)</label>
            <input
              type="text"
              name="keyspace"
              value={formData.keyspace}
              onChange={handleChange}
              placeholder="profile_datastore"
            />
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? '✓' : '✗'} {testResult.message}
              {testResult.clusterName && (
                <div className="cluster-name">Cluster: {testResult.clusterName}</div>
              )}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleTest}
            disabled={testing || !formData.hosts || !formData.datacenter}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button 
            className="btn-success" 
            onClick={handleConnect}
            disabled={connecting || !testResult || !testResult.success}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectionDialog

