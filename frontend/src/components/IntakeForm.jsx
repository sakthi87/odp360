import React, { useState, useEffect } from 'react'
import { generateModel } from '../services/modelerApi'
import './IntakeForm.css'

const CARDINALITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']
const FILTER_TYPES = [
  { label: 'Equality (=)', value: 'EQUALITY' },
  { label: 'Range (>, <, BETWEEN)', value: 'RANGE' },
  { label: 'IN clause', value: 'IN' }
]

const IntakeForm = () => {
  console.log('IntakeForm component rendering')
  
  const [formData, setFormData] = useState({
    edaiReqId: '',
    fundType: '',
    fundValue: '',
    businessLine: '',
    subDomain: '',
    domain: '',
    projectName: '',
    projectDescription: '',
    techOwnerEmail: '',
    developerEmail: '',
    expDevDate: '',
    expITDate: '',
    uatDate: '',
    prodDate: '',
    components: ''
  })

  const [cassandraEntities, setCassandraEntities] = useState([])
  const [apiRows, setApiRows] = useState([])
  const [expandedEntity, setExpandedEntity] = useState(null)
  const [activeTab, setActiveTab] = useState({}) // { entityId: 'csv' | 'fields' | 'patterns' | 'cql' }
  const [modelingResults, setModelingResults] = useState({}) // { entityId: { pk, ck, indexes, cql } }

  // Sync API rows with access patterns from all Cassandra entities
  useEffect(() => {
    // Early return if no entities
    if (!Array.isArray(cassandraEntities) || cassandraEntities.length === 0) {
      return
    }
    
    try {
      // Collect all access patterns from all entities
      const allAccessPatterns = []
      cassandraEntities.forEach(entity => {
        if (entity && entity.accessPatterns && Array.isArray(entity.accessPatterns) && entity.accessPatterns.length > 0) {
          entity.accessPatterns.forEach(pattern => {
            if (pattern && pattern.name && pattern.id) { // Only include patterns with names and IDs
              allAccessPatterns.push({
                entityId: entity.id,
                entityName: entity.entityName || 'unnamed',
                patternId: pattern.id,
                patternName: pattern.name,
                patternDescription: pattern.description || ''
              })
            }
          })
        }
      })

    // Create or update API rows based on access patterns
    setApiRows(prevRows => {
      const existingRows = [...prevRows]
      const patternKeyMap = new Map() // Map to track existing rows by pattern key
      
      // Build map of existing rows by pattern identifier
      existingRows.forEach(row => {
        if (row.patternId && row.entityId) {
          const key = `${row.entityId}_${row.patternId}`
          patternKeyMap.set(key, row)
        }
      })

      // Create new rows for patterns that don't have API rows yet
      const newRows = []
      allAccessPatterns.forEach(ap => {
        const key = `${ap.entityId}_${ap.patternId}`
        if (!patternKeyMap.has(key)) {
          // New pattern - create new API row
          newRows.push({
            id: Date.now() + Math.random(), // Unique ID
            entityId: ap.entityId,
            entityName: ap.entityName,
            patternId: ap.patternId,
            accessPattern: ap.patternName,
            description: ap.patternDescription,
            averageTPS: '',
            peakTPS: '',
            slaInMs: ''
          })
        } else {
          // Existing row - update pattern name/description if changed
          const existingRow = patternKeyMap.get(key)
          if (existingRow.accessPattern !== ap.patternName || existingRow.description !== ap.patternDescription) {
            existingRow.accessPattern = ap.patternName
            existingRow.description = ap.patternDescription
          }
          newRows.push(existingRow)
        }
      })

      // Remove rows for patterns that no longer exist
      const validPatternKeys = new Set(allAccessPatterns.map(ap => `${ap.entityId}_${ap.patternId}`))
      const filteredRows = existingRows.filter(row => {
        if (row.patternId && row.entityId) {
          return validPatternKeys.has(`${row.entityId}_${row.patternId}`)
        }
        // Keep manually added rows (without patternId) if they have accessPattern filled
        return row.accessPattern && row.accessPattern.trim() !== ''
      })

      // Combine: new rows + updated existing rows + manually added rows
      const allNewRows = [...newRows, ...filteredRows.filter(row => !row.patternId || !row.entityId)]
      
      // Remove duplicates and set
      const uniqueRows = []
      const seenKeys = new Set()
      allNewRows.forEach(row => {
        const key = row.patternId && row.entityId ? `${row.entityId}_${row.patternId}` : `manual_${row.id}`
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          uniqueRows.push(row)
        }
      })

      return uniqueRows
    })
    } catch (error) {
      console.error('Error syncing API rows with access patterns:', error)
      // Don't update state on error to prevent breaking the UI
    }
  }, [cassandraEntities])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addCassandraEntity = () => {
    const entityId = Date.now()
    setCassandraEntities(prev => [...prev, {
      id: entityId,
      entityName: '',
      entityDescription: '',
      sorOfData: '',
      retention: '',
      totalRecord: '',
      recordSizeInBytes: '',
      volumeInGBCurrentYear: '',
      volumeInGB5Years: '',
      csvFields: [],
      fieldAttributes: {}, // { fieldName: { cardinality, businessKey, mutable, tenantField, timeField } }
      accessPatterns: [] // [{ id, name, description, fields: [{ field, filterType }], sortFields: [{ field, direction }], cardinality }]
    }])
    // Auto-expand new entity
    setExpandedEntity(entityId)
  }

  const removeCassandraEntity = (id) => {
    setCassandraEntities(prev => prev.filter(entity => entity.id !== id))
    if (expandedEntity === id) {
      setExpandedEntity(null)
    }
    const updated = { ...modelingResults }
    delete updated[id]
    setModelingResults(updated)
  }

  const updateEntity = (id, field, value) => {
    setCassandraEntities(prev => prev.map(entity => 
      entity.id === id ? { ...entity, [field]: value } : entity
    ))
  }

  const parseCsv = async (file) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length < 2) throw new Error('CSV requires a header row and at least one data row.')

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const columnField = headers.findIndex(h => h.includes('column') || h.includes('field'))
    const dataTypeField = headers.findIndex(h => h.includes('type'))
    const descriptionField = headers.findIndex(h => h.includes('description'))

    if (columnField === -1 || dataTypeField === -1) {
      throw new Error('CSV must include column_name and data_type columns.')
    }

    const fields = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const name = values[columnField]
      if (!name) continue
      const dataType = values[dataTypeField] || 'text'
      fields.push({
        name,
        dataType,
        description: descriptionField !== -1 ? values[descriptionField] : ''
      })
    }
    return fields
  }

  const handleCsvUpload = async (entityId, e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const fields = await parseCsv(file)
      updateEntity(entityId, 'csvFields', fields)
      // Initialize field attributes
      const attributes = {}
      fields.forEach(field => {
        attributes[field.name] = {
          cardinality: 'UNKNOWN',
          businessKey: false,
          mutable: false,
          tenantField: false,
          timeField: /time|date|timestamp/i.test(field.dataType)
        }
      })
      updateEntity(entityId, 'fieldAttributes', attributes)
    } catch (error) {
      alert(`Error parsing CSV: ${error.message}`)
    }
  }

  const updateFieldAttribute = (entityId, fieldName, attribute, value) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      const updated = { ...entity }
      updated.fieldAttributes[fieldName] = {
        ...updated.fieldAttributes[fieldName],
        [attribute]: value
      }
      return updated
    }))
  }

  const addAccessPattern = (entityId) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: [...entity.accessPatterns, {
          id: Date.now(),
          name: '',
          description: '',
          fields: [],
          sortFields: [],
          cardinality: 'UNKNOWN'
        }]
      }
    }))
  }

  const removeAccessPattern = (entityId, patternId) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.filter(p => p.id !== patternId)
      }
    }))
  }

  const updateAccessPattern = (entityId, patternId, field, value) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.map(pattern => 
          pattern.id === patternId ? { ...pattern, [field]: value } : pattern
        )
      }
    }))
  }

  const addPatternField = (entityId, patternId) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.map(pattern => 
          pattern.id === patternId 
            ? { ...pattern, fields: [...pattern.fields, { field: '', filterType: 'EQUALITY', sortDirection: '' }] }
            : pattern
        )
      }
    }))
  }

  const removePatternField = (entityId, patternId, fieldIndex) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.map(pattern => 
          pattern.id === patternId 
            ? { ...pattern, fields: pattern.fields.filter((_, idx) => idx !== fieldIndex) }
            : pattern
        )
      }
    }))
  }

  const updatePatternField = (entityId, patternId, fieldIndex, attribute, value) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.map(pattern => 
          pattern.id === patternId 
            ? {
                ...pattern,
                fields: pattern.fields.map((f, idx) => 
                  idx === fieldIndex ? { ...f, [attribute]: value } : f
                )
              }
            : pattern
        )
      }
    }))
  }

  const addSortField = (entityId, patternId) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.map(pattern => 
          pattern.id === patternId 
            ? { ...pattern, sortFields: [...(pattern.sortFields || []), { field: '', direction: 'ASC' }] }
            : pattern
        )
      }
    }))
  }

  const removeSortField = (entityId, patternId, sortFieldIndex) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.map(pattern => 
          pattern.id === patternId 
            ? { ...pattern, sortFields: (pattern.sortFields || []).filter((_, idx) => idx !== sortFieldIndex) }
            : pattern
        )
      }
    }))
  }

  const updateSortField = (entityId, patternId, sortFieldIndex, attribute, value) => {
    setCassandraEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        accessPatterns: entity.accessPatterns.map(pattern => 
          pattern.id === patternId 
            ? {
                ...pattern,
                sortFields: (pattern.sortFields || []).map((sf, idx) => 
                  idx === sortFieldIndex ? { ...sf, [attribute]: value } : sf
                )
              }
            : pattern
        )
      }
    }))
  }

  const handleGenerateCQL = async (entityId) => {
    const entity = cassandraEntities.find(e => e.id === entityId)
    if (!entity) return

    // Validate
    if (entity.csvFields.length === 0) {
      alert('Please upload CSV schema first')
      return
    }
    if (entity.accessPatterns.length === 0) {
      alert('Please add at least one access pattern')
      return
    }

    // Build request for modeler API
    const fields = entity.csvFields.map(field => ({
      name: field.name,
      dataType: field.dataType,
      description: field.description,
      cardinality: entity.fieldAttributes[field.name]?.cardinality || 'UNKNOWN',
      businessKey: entity.fieldAttributes[field.name]?.businessKey || false,
      mutable: entity.fieldAttributes[field.name]?.mutable || false,
      tenantField: entity.fieldAttributes[field.name]?.tenantField || false,
      timeField: entity.fieldAttributes[field.name]?.timeField || false
    }))

    // Send all access patterns together (no primary/secondary distinction)
    const allAccessPatterns = entity.accessPatterns.map(pattern => {
      // Collect filters
      const filters = pattern.fields.map(f => ({
        field: f.field,
        type: f.filterType
      }))
      
      // Collect sort fields from both:
      // 1. Fields that have a sortDirection specified
      // 2. Dedicated sortFields array (for backward compatibility)
      const sortFieldsFromFilters = pattern.fields
        .filter(f => f.field && f.sortDirection)
        .map(f => ({
          field: f.field,
          direction: f.sortDirection
        }))
      
      const sortFieldsFromArray = (pattern.sortFields || []).map(sf => ({
        field: sf.field,
        direction: sf.direction || 'ASC'
      }))
      
      // Combine and deduplicate sort fields (prefer filter-based ones)
      const allSortFields = [...sortFieldsFromFilters]
      sortFieldsFromArray.forEach(sf => {
        if (!allSortFields.find(existing => existing.field === sf.field)) {
          allSortFields.push(sf)
        }
      })
      
      return {
        name: pattern.name,
        description: pattern.description,
        filters: filters,
        sortFields: allSortFields,
        cardinality: pattern.cardinality || 'UNKNOWN'
      }
    })

    const request = {
      entities: [{
        entityName: entity.entityName || 'unnamed',
        keyspace: formData.businessLine || 'odp_poc',
        fields: fields,
        accessPatterns: allAccessPatterns,
        constraints: {
          partitionSizeExpectation: 'MEDIUM',
          queryVolume: 'READ_HEAVY',
          multiTenant: false,
          timeSeries: false
        }
      }]
    }

    try {
      const response = await generateModel(request)
      if (response.entities && response.entities.length > 0) {
        const result = response.entities[0]
        setModelingResults(prev => ({
          ...prev,
          [entityId]: result
        }))
        // Auto-switch to CQL Script tab after generation
        setEntityTab(entityId, 'cql')
      }
    } catch (error) {
      alert(`Error generating CQL: ${error.message}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Build submission data - include modeling results with each entity
    const cassandraDetailsWithResults = cassandraEntities.map(entity => ({
      ...entity,
      modelingResults: modelingResults[entity.id] || null // Include generated CQL results if available
    }))
    
    const submissionData = {
      projectDetails: formData,
      cassandraDetails: cassandraDetailsWithResults,
      apiDetails: apiRows
    }
    console.log('Form submission:', submissionData)
    
    try {
      // Send to backend API
      const response = await fetch('http://localhost:8084/api/intake/submit?clusterId=default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(`Intake submitted successfully! Intake ID: ${result.intakeId}\nStatus: ${result.status}`)
        // Clear form after successful submission
        clearForm()
      } else {
        alert(`Error: ${result.message || 'Failed to submit intake'}`)
      }
    } catch (error) {
      console.error('Error submitting intake:', error)
      alert('Failed to submit intake. Please check console for details.')
    }
  }

  const clearForm = () => {
    // Reset project details
    setFormData({
      edaiReqId: '',
      fundType: '',
      fundValue: '',
      businessLine: '',
      subDomain: '',
      domain: '',
      projectName: '',
      projectDescription: '',
      techOwnerEmail: '',
      developerEmail: '',
      expDevDate: '',
      expITDate: '',
      uatDate: '',
      prodDate: '',
      components: ''
    })
    
    // Clear Cassandra entities
    setCassandraEntities([])
    
    // Clear API rows
    setApiRows([])
    
    // Clear modeling results
    setModelingResults({})
    
    // Reset expanded entity
    setExpandedEntity(null)
    
    // Reset active tabs
    setActiveTab({})
  }

  const toggleEntityExpansion = (entityId) => {
    setExpandedEntity(expandedEntity === entityId ? null : entityId)
    // Set default tab when expanding
    if (expandedEntity !== entityId) {
      setActiveTab(prev => ({ ...prev, [entityId]: 'csv' }))
    }
  }

  const setEntityTab = (entityId, tab) => {
    setActiveTab(prev => ({ ...prev, [entityId]: tab }))
  }

  console.log('IntakeForm about to render, cassandraEntities:', cassandraEntities.length, 'apiRows:', apiRows.length)
  
  return (
    <div className="intake-form-container">
      <form className="intake-form" onSubmit={handleSubmit}>
        <h2 className="form-title">Project Details</h2>
        
        {/* Project Details Section */}
        <div className="project-details-section">
          <div className="form-row">
            <div className="form-column">
              <div className="form-group">
                <label>EDAI Req ID <span className="required">*</span></label>
                <input
                  type="text"
                  name="edaiReqId"
                  value={formData.edaiReqId}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Fund Type</label>
                <select
                  name="fundType"
                  value={formData.fundType}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="capital">Capital</option>
                  <option value="operational">Operational</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Business Line</label>
                <input
                  type="text"
                  name="businessLine"
                  value={formData.businessLine}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Domain</label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Project Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tech Owner Email ID</label>
                <input
                  type="email"
                  name="techOwnerEmail"
                  value={formData.techOwnerEmail}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Exp Dev Date</label>
                <input
                  type="date"
                  name="expDevDate"
                  value={formData.expDevDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>UAT Date</label>
                <input
                  type="date"
                  name="uatDate"
                  value={formData.uatDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label>Fund Value</label>
                <input
                  type="text"
                  name="fundValue"
                  value={formData.fundValue}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Sub Domain</label>
                <input
                  type="text"
                  name="subDomain"
                  value={formData.subDomain}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Project Description</label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Developer Email ID</label>
                <input
                  type="email"
                  name="developerEmail"
                  value={formData.developerEmail}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Exp IT Date</label>
                <input
                  type="date"
                  name="expITDate"
                  value={formData.expITDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Prod Date</label>
                <input
                  type="date"
                  name="prodDate"
                  value={formData.prodDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Components</label>
            <select
              name="components"
              value={formData.components}
              onChange={handleInputChange}
            >
              <option value="">Select</option>
              <option value="cassandra">Cassandra</option>
              <option value="yugabyte">YugabyteDB</option>
              <option value="kafka">Kafka</option>
              <option value="spark">Spark</option>
              <option value="api">Data API</option>
            </select>
          </div>
        </div>

        {/* Cassandra Details Section - Redesigned */}
        <div className="details-section">
          <div className="section-header">
            <h3>Cassandra Details</h3>
            <button type="button" className="add-button" onClick={addCassandraEntity}>
              <span className="plus-icon">+</span> Add Entity
            </button>
          </div>

          {cassandraEntities.map((entity) => (
            <div key={entity.id} className="entity-section">
              {/* Entity Header Row */}
              <div className="entity-header">
                <table className="entity-main-table">
                  <thead>
                    <tr>
                      <th>Entity Name</th>
                      <th>Entity Description</th>
                      <th>SOR of Data</th>
                      <th>Retention</th>
                      <th>Total Record</th>
                      <th>Record Size (Bytes)</th>
                      <th>Volume GB (Current Yr)</th>
                      <th>Volume GB (5 Years)</th>
                      <th>Model</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          type="text"
                          value={entity.entityName}
                          onChange={(e) => updateEntity(entity.id, 'entityName', e.target.value)}
                          placeholder="Entity Name"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={entity.entityDescription}
                          onChange={(e) => updateEntity(entity.id, 'entityDescription', e.target.value)}
                          placeholder="Description"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={entity.sorOfData}
                          onChange={(e) => updateEntity(entity.id, 'sorOfData', e.target.value)}
                          placeholder="SOR"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={entity.retention}
                          onChange={(e) => updateEntity(entity.id, 'retention', e.target.value)}
                          placeholder="Retention"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={entity.totalRecord}
                          onChange={(e) => updateEntity(entity.id, 'totalRecord', e.target.value)}
                          placeholder="Total"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={entity.recordSizeInBytes}
                          onChange={(e) => updateEntity(entity.id, 'recordSizeInBytes', e.target.value)}
                          placeholder="Bytes"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={entity.volumeInGBCurrentYear}
                          onChange={(e) => updateEntity(entity.id, 'volumeInGBCurrentYear', e.target.value)}
                          placeholder="GB"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={entity.volumeInGB5Years}
                          onChange={(e) => updateEntity(entity.id, 'volumeInGB5Years', e.target.value)}
                          placeholder="GB"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="model-dropdown-button"
                          onClick={() => toggleEntityExpansion(entity.id)}
                          title={expandedEntity === entity.id ? 'Collapse Model Details' : 'Expand Model Details'}
                        >
                          {expandedEntity === entity.id ? '▼' : '▶'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => removeCassandraEntity(entity.id)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sub-Sections - Collapsible via Model dropdown */}
              {expandedEntity === entity.id && (
                <div className="entity-sub-sections">
                  {/* Tab Navigation */}
                  <div className="sub-section-tabs">
                    <button
                      type="button"
                      className={`sub-tab ${activeTab[entity.id] === 'csv' ? 'active' : ''}`}
                      onClick={() => setEntityTab(entity.id, 'csv')}
                    >
                      CSV Schema
                    </button>
                    <button
                      type="button"
                      className={`sub-tab ${activeTab[entity.id] === 'fields' ? 'active' : ''}`}
                      onClick={() => setEntityTab(entity.id, 'fields')}
                      disabled={entity.csvFields.length === 0}
                    >
                      Field Attributes
                    </button>
                    <button
                      type="button"
                      className={`sub-tab ${activeTab[entity.id] === 'patterns' ? 'active' : ''}`}
                      onClick={() => setEntityTab(entity.id, 'patterns')}
                      disabled={entity.csvFields.length === 0}
                    >
                      Access Patterns
                    </button>
                    <button
                      type="button"
                      className={`sub-tab ${activeTab[entity.id] === 'cql' ? 'active' : ''}`}
                      onClick={() => setEntityTab(entity.id, 'cql')}
                      disabled={!modelingResults[entity.id]}
                    >
                      CQL Script
                    </button>
                    <button
                      type="button"
                      className="generate-cql-tab-button"
                      onClick={() => handleGenerateCQL(entity.id)}
                      disabled={entity.csvFields.length === 0 || entity.accessPatterns.length === 0}
                    >
                      Generate CQL
                    </button>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="tab-content">
                    {/* CSV Schema Section */}
                    {activeTab[entity.id] === 'csv' && (
                      <div className="sub-section">
                    <h4>CSV Schema</h4>
                    <label className="csv-upload-button">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleCsvUpload(entity.id, e)}
                        style={{ display: 'none' }}
                      />
                      📄 Upload CSV
                    </label>
                    {entity.csvFields.length > 0 && (
                      <div className="csv-fields-display">
                        <p>{entity.csvFields.length} fields loaded</p>
                        <table className="csv-table">
                          <thead>
                            <tr>
                              <th>Field Name</th>
                              <th>Data Type</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entity.csvFields.map((field, idx) => (
                              <tr key={idx}>
                                <td>{field.name}</td>
                                <td>{field.dataType}</td>
                                <td>{field.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                      </div>
                    )}

                    {/* Field Attributes Section */}
                    {activeTab[entity.id] === 'fields' && entity.csvFields.length > 0 && (
                      <div className="sub-section">
                      <h4>Field Attributes</h4>
                      <table className="attributes-table">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Cardinality</th>
                            <th>Business Key</th>
                            <th>Mutable</th>
                            <th>Tenant Field</th>
                            <th>Time Field</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entity.csvFields.map((field) => (
                            <tr key={field.name}>
                              <td>{field.name}</td>
                              <td>
                                <select
                                  value={entity.fieldAttributes[field.name]?.cardinality || 'UNKNOWN'}
                                  onChange={(e) => updateFieldAttribute(entity.id, field.name, 'cardinality', e.target.value)}
                                >
                                  {CARDINALITY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={entity.fieldAttributes[field.name]?.businessKey || false}
                                  onChange={(e) => updateFieldAttribute(entity.id, field.name, 'businessKey', e.target.checked)}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={entity.fieldAttributes[field.name]?.mutable || false}
                                  onChange={(e) => updateFieldAttribute(entity.id, field.name, 'mutable', e.target.checked)}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={entity.fieldAttributes[field.name]?.tenantField || false}
                                  onChange={(e) => updateFieldAttribute(entity.id, field.name, 'tenantField', e.target.checked)}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={entity.fieldAttributes[field.name]?.timeField || false}
                                  onChange={(e) => updateFieldAttribute(entity.id, field.name, 'timeField', e.target.checked)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    )}

                    {/* Access Patterns Section */}
                    {activeTab[entity.id] === 'patterns' && entity.csvFields.length > 0 && (
                      <div className="sub-section">
                      <div className="sub-section-header">
                        <h4>Access Patterns</h4>
                        <button
                          type="button"
                          className="add-small-button"
                          onClick={() => addAccessPattern(entity.id)}
                        >
                          + Add Pattern
                        </button>
                      </div>
                      <table className="patterns-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Fields</th>
                            <th>Cardinality</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entity.accessPatterns.map((pattern) => (
                            <tr key={pattern.id}>
                              <td>
                                <input
                                  type="text"
                                  value={pattern.name}
                                  onChange={(e) => updateAccessPattern(entity.id, pattern.id, 'name', e.target.value)}
                                  placeholder="Pattern name"
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={pattern.description}
                                  onChange={(e) => updateAccessPattern(entity.id, pattern.id, 'description', e.target.value)}
                                  placeholder="Description"
                                />
                              </td>
                              <td>
                                <div className="pattern-fields">
                                  {pattern.fields.map((pf, idx) => (
                                    <div key={idx} className="pattern-field-row">
                                      <select
                                        value={pf.field}
                                        onChange={(e) => updatePatternField(entity.id, pattern.id, idx, 'field', e.target.value)}
                                      >
                                        <option value="">Select field</option>
                                        {entity.csvFields.map(f => (
                                          <option key={f.name} value={f.name}>{f.name}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={pf.filterType}
                                        onChange={(e) => updatePatternField(entity.id, pattern.id, idx, 'filterType', e.target.value)}
                                      >
                                        {FILTER_TYPES.map(ft => (
                                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={pf.sortDirection || ''}
                                        onChange={(e) => updatePatternField(entity.id, pattern.id, idx, 'sortDirection', e.target.value)}
                                        style={{ width: '100px' }}
                                      >
                                        <option value="">No Sort</option>
                                        <option value="ASC">Sort ASC</option>
                                        <option value="DESC">Sort DESC</option>
                                      </select>
                                      <button
                                        type="button"
                                        className="remove-small-button"
                                        onClick={() => removePatternField(entity.id, pattern.id, idx)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="add-field-button"
                                    onClick={() => addPatternField(entity.id, pattern.id)}
                                  >
                                    + Field
                                  </button>
                                  {/* Keep separate sort fields section for backward compatibility and cases where sort field is not a filter */}
                                  {(pattern.sortFields || []).length > 0 && (
                                    <div className="pattern-section" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                                      <strong>Additional Sort Fields (not in filters):</strong>
                                      {(pattern.sortFields || []).map((sf, idx) => (
                                        <div key={idx} className="pattern-field-row">
                                          <select
                                            value={sf.field}
                                            onChange={(e) => updateSortField(entity.id, pattern.id, idx, 'field', e.target.value)}
                                          >
                                            <option value="">Select field</option>
                                            {entity.csvFields.map(f => (
                                              <option key={f.name} value={f.name}>{f.name}</option>
                                            ))}
                                          </select>
                                          <select
                                            value={sf.direction || 'ASC'}
                                            onChange={(e) => updateSortField(entity.id, pattern.id, idx, 'direction', e.target.value)}
                                          >
                                            <option value="ASC">ASC</option>
                                            <option value="DESC">DESC</option>
                                          </select>
                                          <button
                                            type="button"
                                            className="remove-small-button"
                                            onClick={() => removeSortField(entity.id, pattern.id, idx)}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        className="add-field-button"
                                        onClick={() => addSortField(entity.id, pattern.id)}
                                      >
                                        + Sort Field
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <select
                                  value={pattern.cardinality}
                                  onChange={(e) => updateAccessPattern(entity.id, pattern.id, 'cardinality', e.target.value)}
                                >
                                  {CARDINALITY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="remove-small-button"
                                  onClick={() => removeAccessPattern(entity.id, pattern.id)}
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    )}

                    {/* CQL Script Section */}
                    {activeTab[entity.id] === 'cql' && (
                      <div className="sub-section">
                        <h4>CQL Script</h4>
                        {modelingResults[entity.id] ? (
                          <div className="cql-results">
                            <div className="cql-summary-info">
                              <h5>Partition Key: {modelingResults[entity.id].partitionKey?.join(', ') || 'N/A'}</h5>
                              <h5>Clustering Keys: {modelingResults[entity.id].clusteringKeys?.map(ck => `${ck.field} ${ck.order}`).join(', ') || 'N/A'}</h5>
                              <h5>Indexes: {modelingResults[entity.id].indexes?.map(idx => idx.field).join(', ') || 'None'}</h5>
                            </div>
                            <pre className="cql-code">{modelingResults[entity.id].createTableCql}</pre>
                            {modelingResults[entity.id].indexCql && modelingResults[entity.id].indexCql.length > 0 && (
                              <div>
                                <h5>Index Statements:</h5>
                                {modelingResults[entity.id].indexCql.map((idxCql, idx) => (
                                  <pre key={idx} className="cql-code">{idxCql}</pre>
                                ))}
                              </div>
                            )}
                            {modelingResults[entity.id].warnings && modelingResults[entity.id].warnings.length > 0 && (
                              <div className="cql-warnings">
                                <h5>Warnings:</h5>
                                <ul>
                                  {modelingResults[entity.id].warnings.map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="cql-placeholder-section">
                            <p>Please generate CQL first by clicking the "Generate CQL" button.</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* API Details Section */}
        <div className="details-section">
          <div className="section-header">
            <h3>API Details</h3>
            <button 
              type="button" 
              className="add-button" 
              onClick={() => setApiRows([...apiRows, { id: Date.now(), accessPattern: '', description: '', averageTPS: '', peakTPS: '', slaInMs: '' }])}
              title="Add manual API row (not linked to access pattern)"
            >
              <span className="plus-icon">+</span>
            </button>
          </div>
          
          {apiRows.length > 0 && (
            <div className="table-container">
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Access Pattern</th>
                    <th>Description</th>
                    <th>Average TPS</th>
                    <th>Peak TPS</th>
                    <th>SLA in ms</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apiRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.patternId ? (
                          <input
                            type="text"
                            value={row.accessPattern}
                            readOnly
                            className="read-only-input"
                            title="Pre-populated from Cassandra access pattern"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.accessPattern}
                            onChange={(e) => {
                              const updated = apiRows.map(r => r.id === row.id ? { ...r, accessPattern: e.target.value } : r)
                              setApiRows(updated)
                            }}
                            placeholder="Access Pattern"
                          />
                        )}
                      </td>
                      <td>
                        {row.patternId ? (
                          <input
                            type="text"
                            value={row.description}
                            readOnly
                            className="read-only-input"
                            title="Pre-populated from Cassandra access pattern"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => {
                              const updated = apiRows.map(r => r.id === row.id ? { ...r, description: e.target.value } : r)
                              setApiRows(updated)
                            }}
                            placeholder="Description"
                          />
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.averageTPS}
                          onChange={(e) => {
                            const updated = apiRows.map(r => r.id === row.id ? { ...r, averageTPS: e.target.value } : r)
                            setApiRows(updated)
                          }}
                          placeholder="Average TPS"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.peakTPS}
                          onChange={(e) => {
                            const updated = apiRows.map(r => r.id === row.id ? { ...r, peakTPS: e.target.value } : r)
                            setApiRows(updated)
                          }}
                          placeholder="Peak TPS"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.slaInMs}
                          onChange={(e) => {
                            const updated = apiRows.map(r => r.id === row.id ? { ...r, slaInMs: e.target.value } : r)
                            setApiRows(updated)
                          }}
                          placeholder="SLA (ms)"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => setApiRows(apiRows.filter(r => r.id !== row.id))}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">Submit</button>
        </div>
      </form>
    </div>
  )
}

export default IntakeForm
