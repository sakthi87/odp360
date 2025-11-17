import React, { useEffect, useState } from 'react'
import './QueryBuilder.css'

const QueryBuilder = ({ selectedTable, tableDetails, onExecute }) => {
  const [query, setQuery] = useState('')
  const [executing, setExecuting] = useState(false)

  // Auto-generate query when table is selected
  useEffect(() => {
    if (selectedTable && tableDetails && tableDetails.columns) {
      const columns = tableDetails.columns.map((col) => col.name).join(', ')
      const keyspaceName = selectedTable.keyspaceName
      const tableName = selectedTable.tableName
      const generatedQuery = `SELECT ${columns} FROM ${keyspaceName}.${tableName} LIMIT 10`
      setQuery(generatedQuery)
    } else {
      setQuery('')
    }
  }, [selectedTable, tableDetails])

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
  }

  const handleExecute = async () => {
    if (!query.trim()) return
    
    setExecuting(true)
    try {
      await onExecute(query)
    } catch (error) {
      console.error('Error executing query:', error)
    } finally {
      setExecuting(false)
    }
  }

  const handleDeploy = () => {
    if (!query.trim()) {
      alert('Please enter a query to deploy')
      return
    }
    // TODO: Implement deploy functionality
    alert('Deploy functionality coming soon')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleExecute()
    }
  }

  return (
    <div className="query-builder">
      <div className="query-header">
        <h3>Query Builder</h3>
      </div>
      <div className="query-editor-container">
        <textarea
          className="query-editor"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM keyspace.table LIMIT 10"
          spellCheck={false}
        />
      </div>
      <div className="query-footer">
        <div className="query-buttons">
          <button 
            className="execute-button" 
            onClick={handleExecute}
            disabled={!query.trim() || executing || !selectedTable}
          >
            {executing ? 'Executing...' : 'Execute'}
          </button>
          <button 
            className="deploy-button" 
            onClick={handleDeploy}
            disabled={!query.trim() || executing || !selectedTable}
          >
            Deploy
          </button>
        </div>
        <small className="query-hint">Press Ctrl+Enter to execute</small>
      </div>
    </div>
  )
}

export default QueryBuilder

