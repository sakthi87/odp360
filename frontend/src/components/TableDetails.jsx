import React from 'react'
import './TableDetails.css'

const TableDetails = ({ table, details, loading }) => {
  if (loading) {
    return (
      <div className="table-details">
        <div className="details-header">
          <h2>{table?.tableName || 'Loading...'}</h2>
          <span className="details-type">Table</span>
        </div>
        <div className="loading-container">
          <p>Loading table details...</p>
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="table-details">
        <div className="details-header">
          <h2>{table?.tableName || 'Table'}</h2>
          <span className="details-type">Table</span>
        </div>
        <div className="details-placeholder">
          <p>No details available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-details">
      <div className="details-header">
        <h2>{table?.tableName || details.name}</h2>
        <span className="details-type">Table</span>
      </div>
      <div className="details-content">
        {details.columns && details.columns.length > 0 && (
          <div className="details-section">
            <h3>Columns</h3>
            <div className="table-container">
              <table className="columns-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                  </tr>
                </thead>
                <tbody>
                  {details.columns.map((column, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{column.name || column.columnName}</strong>
                        {(column.kind === 'partition_key' || column.kind === 'PARTITION_KEY') && (
                          <span className="column-badge partition-key">PK</span>
                        )}
                        {(column.kind === 'clustering' || column.kind === 'CLUSTERING') && (
                          <span className="column-badge clustering">CL</span>
                        )}
                      </td>
                      <td>
                        <code>{column.type || column.dataType}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {details.indexes && details.indexes.length > 0 && (
          <div className="details-section">
            <h3>Indexes</h3>
            <div className="table-container">
              <table className="indexes-table">
                <thead>
                  <tr>
                    <th>Index Name</th>
                    <th>Column</th>
                    <th>Index Type</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {details.indexes.map((index, idx) => {
                    const indexType = index.indexType || (index.type === 'SOLR' ? 'SOLR' : 'CQL')
                    const isSolr = indexType === 'SOLR'
                    return (
                      <tr key={idx}>
                        <td>
                          <strong>{index.name || index.indexName}</strong>
                          {isSolr && (
                            <span className="index-badge solr-badge">SOLR</span>
                          )}
                          {!isSolr && (
                            <span className="index-badge cql-badge">CQL</span>
                          )}
                        </td>
                        <td>{index.column && index.column !== 'N/A' ? index.column : '-'}</td>
                        <td>
                          <span className={`index-type ${isSolr ? 'solr-type' : 'cql-type'}`}>
                            {isSolr ? 'Solr Search' : (index.type || index.kind || 'Secondary')}
                          </span>
                        </td>
                        <td>
                          {index.options && index.options !== '{}' && (
                            <small className="index-options">{index.options}</small>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!details.indexes || details.indexes.length === 0) && (
          <div className="details-section">
            <h3>Indexes</h3>
            <p className="no-indexes">No indexes defined</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TableDetails
