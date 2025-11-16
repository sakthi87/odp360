import React from 'react'
import './TableRecords.css'

const TableRecords = ({ table, records, loading, queryResults }) => {
  const isQueryResult = queryResults !== null && queryResults !== undefined
  const displayRecords = records || []
  const columns = queryResults?.columns || []

  if (loading) {
    return (
      <div className="table-records">
        <div className="records-header">
          <h3>{isQueryResult ? 'Query Results' : 'Top 10 Records'}</h3>
          <span className="records-count">Loading...</span>
        </div>
        <div className="loading-container">
          <p>Loading records...</p>
        </div>
      </div>
    )
  }

  if (!displayRecords || displayRecords.length === 0) {
    return (
      <div className="table-records">
        <div className="records-header">
          <h3>{isQueryResult ? 'Query Results' : 'Top 10 Records'}</h3>
          <span className="records-count">0 records</span>
        </div>
        <div className="records-placeholder">
          <p>No records found</p>
        </div>
      </div>
    )
  }

  // Use query columns if available, otherwise extract from records
  const columnHeaders = columns.length > 0 
    ? columns 
    : (() => {
        const allKeys = new Set()
        displayRecords.forEach((record) => {
          Object.keys(record).forEach((key) => allKeys.add(key))
        })
        return Array.from(allKeys)
      })()

  return (
    <div className="table-records">
      <div className="records-header">
        <h3>{isQueryResult ? 'Query Results' : 'Top 10 Records'}</h3>
        <div className="records-meta">
          <span className="records-count">{displayRecords.length} record(s)</span>
          {queryResults?.executionTime && (
            <span className="execution-time">Executed in {queryResults.executionTime}ms</span>
          )}
        </div>
      </div>
      <div className="records-content">
        <div className="table-container">
          <table className="records-table">
            <thead>
              <tr>
                {columnHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRecords.map((record, rowIndex) => (
                <tr key={rowIndex}>
                  {columnHeaders.map((header) => {
                    const value = record[header]
                    return (
                      <td key={header}>
                        {value === null || value === undefined ? (
                          <span className="null-value">NULL</span>
                        ) : typeof value === 'object' ? (
                          <pre className="cell-json">{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          String(value)
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TableRecords

