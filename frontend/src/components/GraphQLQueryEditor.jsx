import React, { useState } from 'react'
import './GraphQLQueryEditor.css'

const GraphQLQueryEditor = ({
  query,
  onQueryChange,
  onExecute,
  executing,
  queryResults
}) => {
  const [activeTab, setActiveTab] = useState('query') // 'query' or 'results'

  const handleQueryChange = (e) => {
    onQueryChange(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onExecute()
    }
  }

  const formatJSON = (obj) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch (e) {
      return String(obj)
    }
  }

  return (
    <div className="graphql-query-editor">
      <div className="editor-header">
        <div className="editor-tabs">
          <button
            className={`tab-button ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveTab('query')}
          >
            Query
          </button>
          <button
            className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!queryResults}
          >
            Results
            {queryResults && (
              <span className="tab-badge">
                {queryResults.errors ? '⚠️' : '✓'}
              </span>
            )}
          </button>
        </div>
        <button
          className="execute-button"
          onClick={onExecute}
          disabled={!query.trim() || executing}
        >
          {executing ? 'Executing...' : '▶ Execute'}
        </button>
      </div>

      <div className="editor-content">
        {activeTab === 'query' ? (
          <div className="query-editor-container">
            <textarea
              className="query-editor"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter your GraphQL query here...&#10;&#10;Example:&#10;query GetUsers {&#10;  users {&#10;    id&#10;    name&#10;  }&#10;}"
              spellCheck={false}
            />
            <div className="editor-footer">
              <small className="query-hint">Press Ctrl+Enter (Cmd+Enter on Mac) to execute</small>
            </div>
          </div>
        ) : (
          <div className="results-container">
            {queryResults ? (
              <div className="results-content">
                {queryResults.errors ? (
                  <div className="results-errors">
                    <h4>Errors:</h4>
                    <pre>{formatJSON(queryResults.errors)}</pre>
                  </div>
                ) : null}
                {queryResults.data ? (
                  <div className="results-data">
                    <h4>Data:</h4>
                    <pre>{formatJSON(queryResults.data)}</pre>
                  </div>
                ) : null}
                {!queryResults.data && !queryResults.errors ? (
                  <div className="results-empty">
                    <p>No results to display</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="results-empty">
                <p>Execute a query to see results here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphQLQueryEditor

