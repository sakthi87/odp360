import React, { useState } from 'react'
import './GraphQLResponse.css'

const GraphQLResponse = ({ results, executing }) => {
  const [activeView, setActiveView] = useState('body') // 'body', 'headers', 'cookies'

  const formatJSON = (obj) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch (e) {
      return String(obj)
    }
  }

  const formatHeaders = (headers) => {
    if (!headers) return ''
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  }

  if (executing) {
    return (
      <div className="graphql-response">
        <div className="response-header">
          <div className="response-tabs">
            <button className="tab-button active">Response</button>
          </div>
        </div>
        <div className="response-content">
          <div className="response-loading">
            <div className="loading-spinner"></div>
            <p>Executing request...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="graphql-response">
        <div className="response-header">
          <div className="response-tabs">
            <button className="tab-button active">Response</button>
          </div>
        </div>
        <div className="response-content">
          <div className="response-empty">
            <div className="empty-illustration">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="80" fill="#f0f0f0"/>
                <path d="M60 100 L90 130 L140 70" stroke="#999" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p>Click Send to get a response</p>
          </div>
        </div>
      </div>
    )
  }

  const statusClass = results.status >= 200 && results.status < 300 ? 'success' : 'error'

  return (
    <div className="graphql-response">
      <div className="response-header">
        <div className="response-tabs">
          <button className="tab-button active">Response</button>
        </div>
        <div className="response-status">
          <span className={`status-badge ${statusClass}`}>
            {results.status} {results.statusText}
          </span>
          <span className="response-time">0ms</span>
        </div>
      </div>
      <div className="response-view-tabs">
        <button
          className={`view-tab ${activeView === 'body' ? 'active' : ''}`}
          onClick={() => setActiveView('body')}
        >
          Body
        </button>
        <button
          className={`view-tab ${activeView === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveView('headers')}
        >
          Headers
        </button>
        <button
          className={`view-tab ${activeView === 'cookies' ? 'active' : ''}`}
          onClick={() => setActiveView('cookies')}
        >
          Cookies
        </button>
      </div>
      <div className="response-content">
        {activeView === 'body' && (
          <div className="response-body">
            {results.errors ? (
              <div className="response-errors">
                <h4>Errors:</h4>
                <pre>{formatJSON(results.errors)}</pre>
              </div>
            ) : null}
            {results.data ? (
              <div className="response-data">
                <div className="response-format-selector">
                  <button className="format-button active">JSON</button>
                  <button className="format-button">Raw</button>
                  <button className="format-button">Preview</button>
                </div>
                <pre>{formatJSON(results.data)}</pre>
              </div>
            ) : null}
            {!results.data && !results.errors ? (
              <div className="response-empty">
                <p>No response data</p>
              </div>
            ) : null}
          </div>
        )}
        {activeView === 'headers' && (
          <div className="response-headers">
            <pre>{formatHeaders(results.headers)}</pre>
          </div>
        )}
        {activeView === 'cookies' && (
          <div className="response-cookies">
            <p>No cookies</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphQLResponse

