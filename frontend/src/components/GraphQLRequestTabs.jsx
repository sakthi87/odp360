import React, { useState } from 'react'
import './GraphQLRequestTabs.css'

const GraphQLRequestTabs = ({
  activeTab,
  onTabChange,
  query,
  onQueryChange,
  variables,
  onVariablesChange,
  params,
  onParamsChange,
  headers,
  onHeadersChange,
  authorization,
  onAuthorizationChange
}) => {
  const [bodyFormat, setBodyFormat] = useState('graphql')
  
  const handleFormatVariables = () => {
    try {
      const parsed = JSON.parse(variables)
      onVariablesChange(JSON.stringify(parsed, null, 2))
    } catch (e) {
      alert('Invalid JSON. Cannot format.')
    }
  }
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'params', label: 'Params' },
    { id: 'authorization', label: 'Authorization' },
    { id: 'headers', label: `Headers (${headers.filter(h => h.enabled).length})` },
    { id: 'body', label: 'Body' },
    { id: 'scripts', label: 'Scripts' },
    { id: 'settings', label: 'Settings' }
  ]

  const handleAddParam = () => {
    onParamsChange([...params, { key: '', value: '', enabled: true }])
  }

  const handleParamChange = (index, field, value) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    onParamsChange(newParams)
  }

  const handleRemoveParam = (index) => {
    onParamsChange(params.filter((_, i) => i !== index))
  }

  const handleAddHeader = () => {
    onHeadersChange([...headers, { key: '', value: '', enabled: true }])
  }

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    onHeadersChange(newHeaders)
  }

  const handleRemoveHeader = (index) => {
    onHeadersChange(headers.filter((_, i) => i !== index))
  }


  return (
    <div className="graphql-request-tabs">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && tab.id === 'body' && (
              <span className="tab-indicator">●</span>
            )}
          </button>
        ))}
      </div>

      <div className="tabs-content">
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <p>Request overview and details</p>
          </div>
        )}

        {activeTab === 'params' && (
          <div className="tab-panel">
            <div className="params-table">
              <div className="table-header">
                <div className="col-checkbox">✓</div>
                <div className="col-key">Key</div>
                <div className="col-value">Value</div>
                <div className="col-actions"></div>
              </div>
              {params.map((param, index) => (
                <div key={index} className="table-row">
                  <div className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => handleParamChange(index, 'enabled', e.target.checked)}
                    />
                  </div>
                  <div className="col-key">
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                      placeholder="Key"
                    />
                  </div>
                  <div className="col-value">
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                  <div className="col-actions">
                    <button onClick={() => handleRemoveParam(index)}>×</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="add-row-button" onClick={handleAddParam}>
              + Add
            </button>
          </div>
        )}

        {activeTab === 'authorization' && (
          <div className="tab-panel">
            <div className="auth-type-selector">
              <label>Type:</label>
              <select
                value={authorization.type}
                onChange={(e) => onAuthorizationChange({ ...authorization, type: e.target.value })}
              >
                <option value="No Auth">No Auth</option>
                <option value="Bearer Token">Bearer Token</option>
                <option value="API Key">API Key</option>
                <option value="Basic Auth">Basic Auth</option>
              </select>
            </div>

            {authorization.type === 'Bearer Token' && (
              <div className="auth-config">
                <label>Token:</label>
                <input
                  type="text"
                  value={authorization.bearerToken}
                  onChange={(e) => onAuthorizationChange({ ...authorization, bearerToken: e.target.value })}
                  placeholder="Enter bearer token"
                />
              </div>
            )}

            {authorization.type === 'API Key' && (
              <div className="auth-config">
                <label>Key:</label>
                <input
                  type="text"
                  value={authorization.apiKey.key}
                  onChange={(e) => onAuthorizationChange({
                    ...authorization,
                    apiKey: { ...authorization.apiKey, key: e.target.value }
                  })}
                  placeholder="API Key name"
                />
                <label>Value:</label>
                <input
                  type="text"
                  value={authorization.apiKey.value}
                  onChange={(e) => onAuthorizationChange({
                    ...authorization,
                    apiKey: { ...authorization.apiKey, value: e.target.value }
                  })}
                  placeholder="API Key value"
                />
                <label>Add to:</label>
                <select
                  value={authorization.apiKey.addTo}
                  onChange={(e) => onAuthorizationChange({
                    ...authorization,
                    apiKey: { ...authorization.apiKey, addTo: e.target.value }
                  })}
                >
                  <option value="Header">Header</option>
                  <option value="Query Params">Query Params</option>
                </select>
              </div>
            )}

            {authorization.type === 'Basic Auth' && (
              <div className="auth-config">
                <label>Username:</label>
                <input
                  type="text"
                  value={authorization.basicAuth.username}
                  onChange={(e) => onAuthorizationChange({
                    ...authorization,
                    basicAuth: { ...authorization.basicAuth, username: e.target.value }
                  })}
                  placeholder="Username"
                />
                <label>Password:</label>
                <input
                  type="password"
                  value={authorization.basicAuth.password}
                  onChange={(e) => onAuthorizationChange({
                    ...authorization,
                    basicAuth: { ...authorization.basicAuth, password: e.target.value }
                  })}
                  placeholder="Password"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="tab-panel">
            <div className="headers-table">
              <div className="table-header">
                <div className="col-checkbox">✓</div>
                <div className="col-key">Key</div>
                <div className="col-value">Value</div>
                <div className="col-actions"></div>
              </div>
              {headers.map((header, index) => (
                <div key={index} className="table-row">
                  <div className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => handleHeaderChange(index, 'enabled', e.target.checked)}
                    />
                  </div>
                  <div className="col-key">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                      placeholder="Key"
                    />
                  </div>
                  <div className="col-value">
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                  <div className="col-actions">
                    <button onClick={() => handleRemoveHeader(index)}>×</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="add-row-button" onClick={handleAddHeader}>
              + Add
            </button>
          </div>
        )}

        {activeTab === 'body' && (
          <div className="tab-panel body-panel">
            <div className="body-format-row">
              <div className="body-format-selector">
                <label>
                  <input 
                    type="radio" 
                    name="bodyFormat" 
                    value="none"
                    checked={bodyFormat === 'none'}
                    onChange={(e) => setBodyFormat(e.target.value)}
                  />
                  none
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="bodyFormat" 
                    value="form-data"
                    checked={bodyFormat === 'form-data'}
                    onChange={(e) => setBodyFormat(e.target.value)}
                  />
                  form-data
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="bodyFormat" 
                    value="x-www-form-urlencoded"
                    checked={bodyFormat === 'x-www-form-urlencoded'}
                    onChange={(e) => setBodyFormat(e.target.value)}
                  />
                  x-www-form-urlencoded
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="bodyFormat" 
                    value="raw"
                    checked={bodyFormat === 'raw'}
                    onChange={(e) => setBodyFormat(e.target.value)}
                  />
                  raw
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="bodyFormat" 
                    value="binary"
                    checked={bodyFormat === 'binary'}
                    onChange={(e) => setBodyFormat(e.target.value)}
                  />
                  binary
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="bodyFormat" 
                    value="graphql"
                    checked={bodyFormat === 'graphql'}
                    onChange={(e) => setBodyFormat(e.target.value)}
                  />
                  GraphQL
                </label>
              </div>

              {bodyFormat === 'graphql' && (
                <div className="body-options">
                  <select className="body-type-select" defaultValue="json">
                    <option value="json">JSON</option>
                    <option value="text">Text</option>
                  </select>
                </div>
              )}
            </div>

            {bodyFormat === 'graphql' && (
              <div className="body-editor-container">
                <div className="query-section">
                  <div className="section-header">
                    <span>Query</span>
                  </div>
                  <textarea
                    className="graphql-query-editor"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Enter your GraphQL query here...&#10;&#10;Example:&#10;query GetUsers {&#10;  users {&#10;    id&#10;    name&#10;  }&#10;}"
                    spellCheck={false}
                  />
                </div>

                <div className="variables-section">
                  <div className="section-header">
                    <span>Variables</span>
                    <button className="format-button" onClick={handleFormatVariables}>
                      Format
                    </button>
                  </div>
                  <textarea
                    className="graphql-variables-editor"
                    value={variables}
                    onChange={(e) => onVariablesChange(e.target.value)}
                    placeholder='Enter GraphQL variables as JSON...&#10;&#10;Example:&#10;{&#10;  "id": "1",&#10;  "limit": 10&#10;}'
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {bodyFormat !== 'graphql' && (
              <div className="body-placeholder">
                <p>Body format "{bodyFormat}" is not yet implemented. Please use GraphQL format.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="tab-panel">
            <p>Pre-request and test scripts</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-panel">
            <p>Request settings and options</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphQLRequestTabs

