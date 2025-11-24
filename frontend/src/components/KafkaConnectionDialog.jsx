import React, { useState } from 'react'
import './ConnectionDialog.css'

const KafkaConnectionDialog = ({ open, onClose, onTest, onConnect, testing, connecting }) => {
  const [formData, setFormData] = useState({
    name: '',
    bootstrapServers: 'localhost:9092',
    securityProtocol: 'PLAINTEXT',
    saslMechanism: 'PLAIN',
    username: '',
    password: '',
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
    try {
      const connectionRequest = {
        name: formData.name || 'Untitled Connection',
        bootstrapServers: formData.bootstrapServers.split(',').map(s => s.trim()).filter(s => s),
        securityProtocol: formData.securityProtocol,
        saslMechanism: formData.securityProtocol.includes('SASL') ? formData.saslMechanism : null,
        username: formData.username || null,
        password: formData.password || null,
      }
      const result = await onTest(connectionRequest)
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, message: error.message })
    }
  }

  const handleConnect = async () => {
    if (!testResult || !testResult.success) {
      alert('Please test connection first')
      return
    }

    try {
      const connectionRequest = {
        name: formData.name || 'Untitled Connection',
        bootstrapServers: formData.bootstrapServers.split(',').map(s => s.trim()).filter(s => s),
        securityProtocol: formData.securityProtocol,
        saslMechanism: formData.securityProtocol.includes('SASL') ? formData.saslMechanism : null,
        username: formData.username || null,
        password: formData.password || null,
      }
      await onConnect(connectionRequest)
      
      // Reset form
      setFormData({
        name: '',
        bootstrapServers: 'localhost:9092',
        securityProtocol: 'PLAINTEXT',
        saslMechanism: 'PLAIN',
        username: '',
        password: '',
      })
      setTestResult(null)
      onClose()
    } catch (error) {
      alert('Failed to connect: ' + error.message)
    }
  }

  return (
    <div className="connection-dialog-overlay" onClick={onClose}>
      <div className="connection-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Connect to Kafka</h2>
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
              placeholder="e.g., Dev Kafka Cluster"
            />
          </div>

          <div className="form-group">
            <label>Bootstrap Servers <span className="required">*</span></label>
            <input
              type="text"
              name="bootstrapServers"
              value={formData.bootstrapServers}
              onChange={handleChange}
              placeholder="localhost:9092 or host1:9092,host2:9092"
              required
            />
            <small>Comma-separated for multiple brokers</small>
          </div>

          <div className="form-group">
            <label>Security Protocol</label>
            <select
              name="securityProtocol"
              value={formData.securityProtocol}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="PLAINTEXT">PLAINTEXT</option>
              <option value="SSL">SSL</option>
              <option value="SASL_PLAINTEXT">SASL_PLAINTEXT</option>
              <option value="SASL_SSL">SASL_SSL</option>
            </select>
            <small>Select SASL_PLAINTEXT or SASL_SSL for username/password authentication</small>
          </div>

          {formData.securityProtocol.includes('SASL') && (
            <div className="form-group">
              <label>SASL Mechanism</label>
              <select
                name="saslMechanism"
                value={formData.saslMechanism}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="PLAIN">PLAIN</option>
                <option value="SCRAM-SHA-256">SCRAM-SHA-256</option>
                <option value="SCRAM-SHA-512">SCRAM-SHA-512</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Username (optional)</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="kafka-user"
            />
            <small>{formData.securityProtocol.includes('SASL') ? 'Required for SASL authentication' : 'Only used if Security Protocol includes SASL'}</small>
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
            <small>{formData.securityProtocol.includes('SASL') ? 'Required for SASL authentication' : 'Only used if Security Protocol includes SASL'}</small>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? '✓' : '✗'} {testResult.message}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleTest}
            disabled={testing || !formData.bootstrapServers}
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

export default KafkaConnectionDialog
