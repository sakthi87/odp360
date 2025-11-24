import React from 'react'
import './GraphQLRequestBar.css'

const GraphQLRequestBar = ({ url, onUrlChange, onExecute, executing }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onExecute()
    }
  }

  return (
    <div className="graphql-request-bar">
      <div className="request-method">
        <select className="method-select" defaultValue="POST">
          <option value="POST">POST</option>
          <option value="GET">GET</option>
        </select>
      </div>
      <div className="request-url-container">
        <input
          type="text"
          className="request-url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter GraphQL endpoint URL..."
        />
      </div>
      <div className="request-actions">
        <button
          className="send-button"
          onClick={onExecute}
          disabled={executing || !url.trim()}
        >
          {executing ? 'Sending...' : 'Send'}
          <span className="send-arrow">▼</span>
        </button>
      </div>
    </div>
  )
}

export default GraphQLRequestBar

