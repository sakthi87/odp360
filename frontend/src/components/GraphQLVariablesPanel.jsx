import React from 'react'
import './GraphQLVariablesPanel.css'

const GraphQLVariablesPanel = ({ variables, onVariablesChange }) => {
  const handleVariablesChange = (e) => {
    onVariablesChange(e.target.value)
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(variables)
      const formatted = JSON.stringify(parsed, null, 2)
      onVariablesChange(formatted)
    } catch (e) {
      alert('Invalid JSON. Cannot format.')
    }
  }

  const handleClear = () => {
    onVariablesChange('{}')
  }

  return (
    <div className="graphql-variables-panel">
      <div className="variables-header">
        <h3>Variables</h3>
        <div className="variables-actions">
          <button className="format-button" onClick={handleFormat} title="Format JSON">
            Format
          </button>
          <button className="clear-button" onClick={handleClear} title="Clear">
            Clear
          </button>
        </div>
      </div>
      <div className="variables-content">
        <textarea
          className="variables-editor"
          value={variables}
          onChange={handleVariablesChange}
          placeholder='Enter GraphQL variables as JSON...&#10;&#10;Example:&#10;{&#10;  "id": "1",&#10;  "limit": 10,&#10;  "searchTerm": "laptop"&#10;}'
          spellCheck={false}
        />
        <div className="variables-footer">
          <small className="variables-hint">
            Enter variables as valid JSON
          </small>
        </div>
      </div>
    </div>
  )
}

export default GraphQLVariablesPanel

