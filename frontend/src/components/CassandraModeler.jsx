import React, { useState } from 'react'
import { generateModel } from '../services/modelerApi'
import './CassandraModeler.css'

const CARDINALITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']
const FILTER_TYPES = [
  { label: 'Equality (=)', value: 'EQUALITY' },
  { label: 'Range (>, <, BETWEEN)', value: 'RANGE' },
  { label: 'IN clause', value: 'IN' }
]
const PARTITION_SIZE_OPTIONS = ['SMALL', 'MEDIUM', 'LARGE', 'VERY_LARGE']
const QUERY_VOLUME_OPTIONS = ['READ_HEAVY', 'WRITE_HEAVY', 'BALANCED']

const createEmptyEntity = () => ({
  id: Date.now(),
  entityName: '',
  keyspace: '',
  description: '',
  fieldsMetadata: [],
  primaryPattern: {
    description: '',
    filters: [],
    sortFields: [],
    queryFrequency: 'HIGH'
  },
  secondaryPatterns: [],
  constraints: {
    partitionSizeExpectation: 'MEDIUM',
    queryVolume: 'READ_HEAVY',
    multiTenant: false,
    tenantField: '',
    timeSeries: false,
    timeOrderingField: '',
    ttlSeconds: '',
    retentionDays: '',
    expectedPartitionSizeMb: '',
    keyspace: ''
  },
  result: null,
  warnings: [],
  error: null
})

const CassandraModeler = () => {
  const [entities, setEntities] = useState([createEmptyEntity()])
  const [activeModal, setActiveModal] = useState(null)
  const [modalEntityId, setModalEntityId] = useState(null)
  const [modalDraft, setModalDraft] = useState(null)
  const [loadingEntityId, setLoadingEntityId] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  const currentEntity = entities.find((entity) => entity.id === modalEntityId)

  const openModal = (type, entityId) => {
    const entity = entities.find((item) => item.id === entityId)
    if (!entity) return

    if (type === 'fields') {
      setModalDraft(entity.fieldsMetadata.map((field) => ({ ...field })))
    } else if (type === 'primary') {
      setModalDraft({
        description: entity.primaryPattern.description,
        queryFrequency: entity.primaryPattern.queryFrequency,
        filters: entity.primaryPattern.filters.map((filter) => ({ ...filter })),
        sortFields: entity.primaryPattern.sortFields.map((field) => ({ ...field }))
      })
    } else if (type === 'secondary') {
      setModalDraft(entity.secondaryPatterns.map((pattern) => ({
        ...pattern,
        filters: pattern.filters ? pattern.filters.map((filter) => ({ ...filter })) : []
      })))
    } else if (type === 'constraints') {
      setModalDraft({ ...entity.constraints })
    }

    setActiveModal(type)
    setModalEntityId(entityId)
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalEntityId(null)
    setModalDraft(null)
  }

  const handleAddEntity = () => {
    setEntities((prev) => [...prev, createEmptyEntity()])
  }

  const handleRemoveEntity = (entityId) => {
    setEntities((prev) => prev.filter((entity) => entity.id !== entityId))
  }

  const updateEntity = (entityId, updateFn) => {
    setEntities((prev) =>
      prev.map((entity) => {
        if (entity.id !== entityId) return entity
        return updateFn(entity)
      })
    )
  }

  const parseCsv = async (file) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length < 2) throw new Error('CSV requires a header row and at least one data row.')

    const headers = lines[0].split(',').map((header) => header.trim().toLowerCase())
    const columnField = headers.findIndex((header) => header.includes('column') || header.includes('field'))
    const dataTypeField = headers.findIndex((header) => header.includes('type'))
    const descriptionField = headers.findIndex((header) => header.includes('description'))

    if (columnField === -1 || dataTypeField === -1) {
      throw new Error('CSV must include column_name and data_type columns.')
    }

    const fieldRows = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((value) => value.trim())
      const name = values[columnField]
      if (!name) continue
      const dataType = values[dataTypeField] || 'text'
      fieldRows.push({
        name,
        dataType,
        description: descriptionField !== -1 ? values[descriptionField] : '',
        businessKey: false,
        mutable: false,
        tenantField: false,
        timeField: /time|date/i.test(dataType),
        cardinality: 'UNKNOWN'
      })
    }
    return fieldRows
  }

  const handleCsvUpload = async (entityId, event) => {
    const file = event.target.files[0]
    if (!file) return
    try {
      const parsedFields = await parseCsv(file)
      updateEntity(entityId, (entity) => ({
        ...entity,
        fieldsMetadata: parsedFields,
        result: null,
        error: null
      }))
      setStatusMessage(`Parsed ${parsedFields.length} fields from ${file.name}`)
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  const saveFields = () => {
    updateEntity(modalEntityId, (entity) => ({
      ...entity,
      fieldsMetadata: modalDraft
    }))
    closeModal()
  }

  const savePrimaryPattern = () => {
    updateEntity(modalEntityId, (entity) => ({
      ...entity,
      primaryPattern: {
        description: modalDraft.description,
        queryFrequency: modalDraft.queryFrequency,
        filters: modalDraft.filters.filter((filter) => filter.field),
        sortFields: modalDraft.sortFields.filter((field) => field.field)
      }
    }))
    closeModal()
  }

  const saveSecondaryPatterns = () => {
    updateEntity(modalEntityId, (entity) => ({
      ...entity,
      secondaryPatterns: modalDraft.map((pattern) => ({
        ...pattern,
        filters: pattern.filters.filter((filter) => filter.field)
      }))
    }))
    closeModal()
  }

  const saveConstraints = () => {
    updateEntity(modalEntityId, (entity) => ({
      ...entity,
      constraints: modalDraft
    }))
    closeModal()
  }

  const isEntityReady = (entity) => {
    const nameReady = entity.entityName.trim().length > 0
    const csvReady = entity.fieldsMetadata.length > 0
    const fieldsReady = csvReady && entity.fieldsMetadata.every((field) => field.cardinality && field.cardinality !== 'UNKNOWN')
    const primaryReady = entity.primaryPattern.filters.length > 0
    return nameReady && csvReady && fieldsReady && primaryReady
  }

  const buildRequestPayload = (entity) => {
    return {
      entities: [
        {
          entityName: entity.entityName,
          keyspace: entity.keyspace,
          description: entity.description,
          fields: entity.fieldsMetadata,
          primaryAccessPattern: entity.primaryPattern,
          secondaryAccessPatterns: entity.secondaryPatterns,
          constraints: {
            ...entity.constraints,
            ttlSeconds: entity.constraints.ttlSeconds
              ? Number(entity.constraints.ttlSeconds)
              : undefined,
            retentionDays: entity.constraints.retentionDays
              ? Number(entity.constraints.retentionDays)
              : undefined,
            expectedPartitionSizeMb: entity.constraints.expectedPartitionSizeMb
              ? Number(entity.constraints.expectedPartitionSizeMb)
              : undefined
          }
        }
      ]
    }
  }

  const handleGenerate = async (entityId) => {
    const entity = entities.find((item) => item.id === entityId)
    if (!entity) return

    if (!isEntityReady(entity)) {
      setStatusMessage('Please complete entity name, CSV upload, field annotations, and primary access pattern before generating.')
      return
    }

    try {
      setLoadingEntityId(entityId)
      const payload = buildRequestPayload(entity)
      const response = await generateModel(payload)
      const generated = response.entities?.[0]
      if (!generated) throw new Error('Empty response from server.')

      updateEntity(entityId, (current) => ({
        ...current,
        result: generated,
        warnings: generated.warnings || [],
        error: null
      }))
    } catch (error) {
      updateEntity(entityId, (current) => ({
        ...current,
        error: error.message,
        result: null
      }))
      setStatusMessage(error.message)
    } finally {
      setLoadingEntityId(null)
    }
  }

  const addFilterRow = (filters, setFilters) => {
    setFilters([
      ...filters,
      {
        id: Date.now(),
        field: '',
        type: 'EQUALITY',
        notes: ''
      }
    ])
  }

  const addSortRow = (sortFields, setSortFields) => {
    setSortFields([
      ...sortFields,
      {
        id: Date.now(),
        field: '',
        direction: 'ASC'
      }
    ])
  }

  const addSecondaryPattern = () => {
    setModalDraft([
      ...modalDraft,
      {
        id: Date.now(),
        description: '',
        filters: [],
        sortFields: []
      }
    ])
  }

  const renderStatusBadge = (label, complete) => (
    <span className={`modeler-badge ${complete ? 'complete' : 'pending'}`}>
      {label}
    </span>
  )

  const renderResult = (entity) => {
    if (!entity.result) return null
    const { result } = entity

    return (
      <div className="modeler-result-card">
        <div className="modeler-result-grid">
          <div>
            <h4>Partition Key</h4>
            <p>{result.partitionKey.join(', ')}</p>
          </div>
          <div>
            <h4>Clustering Keys</h4>
            {result.clusteringKeys.length ? (
              <ul>
                {result.clusteringKeys.map((key) => (
                  <li key={key.field}>
                    {key.field} ({key.type}) – {key.order}
                  </li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
          </div>
          <div>
            <h4>Indexes</h4>
            {result.indexes.length ? (
              <ul>
                {result.indexes.map((index) => (
                  <li key={index.field}>
                    {index.field} – {index.reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No secondary indexes required</p>
            )}
          </div>
        </div>

        {result.summary && (
          <div className="modeler-summary">
            <h4>Summary</h4>
            <ul>
              {Object.entries(result.summary).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entity.warnings.length > 0 && (
          <div className="modeler-warnings">
            <h4>Warnings</h4>
            <ul>
              {entity.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="modeler-cql">
          <h4>Create Table CQL</h4>
          <pre>{result.createTableCql}</pre>
        </div>

        {result.indexCql && result.indexCql.length > 0 && (
          <div className="modeler-cql">
            <h4>Index Statements</h4>
            <pre>{result.indexCql.join('\n')}</pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="modeler-container">
      <div className="modeler-header">
        <div>
          <h2>Cassandra Data Modeling Workbench</h2>
          <p>Upload CSV schemas, capture access patterns, and generate PK/CK/Index recommendations.</p>
        </div>
        <button className="modeler-add-entity" onClick={handleAddEntity}>
          + Add Entity
        </button>
      </div>

      {statusMessage && <div className="modeler-status">{statusMessage}</div>}

      <div className="modeler-entity-table-wrapper">
        <table className="modeler-entity-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>CSV Schema</th>
              <th>Field Attributes</th>
              <th>Primary Access Pattern</th>
              <th>Secondary Patterns</th>
              <th>Constraints</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => {
              const csvReady = entity.fieldsMetadata.length > 0
              const fieldsReady = csvReady && entity.fieldsMetadata.every((field) => field.cardinality && field.cardinality !== 'UNKNOWN')
              const primaryReady = entity.primaryPattern.filters.length > 0
              const readyForGeneration = isEntityReady(entity)

              return (
                <React.Fragment key={entity.id}>
                  <tr>
                    <td>
                      <input
                        type="text"
                        placeholder="Entity/Table Name"
                        value={entity.entityName}
                        onChange={(event) =>
                          updateEntity(entity.id, (current) => ({
                            ...current,
                            entityName: event.target.value
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Keyspace (optional)"
                        value={entity.keyspace}
                        onChange={(event) =>
                          updateEntity(entity.id, (current) => ({
                            ...current,
                            keyspace: event.target.value
                          }))
                        }
                      />
                      <textarea
                        placeholder="Entity description"
                        value={entity.description}
                        onChange={(event) =>
                          updateEntity(entity.id, (current) => ({
                            ...current,
                            description: event.target.value
                          }))
                        }
                      />
                    </td>
                    <td>
                      <label className="modeler-upload">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(event) => handleCsvUpload(entity.id, event)}
                          hidden
                        />
                        Upload CSV
                      </label>
                      {csvReady && <p className="modeler-hint">{entity.fieldsMetadata.length} fields</p>}
                    </td>
                    <td>
                      <button
                        className="modeler-link"
                        disabled={!csvReady}
                        onClick={() => openModal('fields', entity.id)}
                      >
                        Annotate Fields
                      </button>
                      {renderStatusBadge('Cardinality', fieldsReady)}
                    </td>
                    <td>
                      <button
                        className="modeler-link"
                        disabled={!csvReady}
                        onClick={() => openModal('primary', entity.id)}
                      >
                        Set Primary Pattern
                      </button>
                      {renderStatusBadge('Primary', primaryReady)}
                    </td>
                    <td>
                      <button
                        className="modeler-link"
                        disabled={!csvReady}
                        onClick={() => openModal('secondary', entity.id)}
                      >
                        Manage Patterns
                      </button>
                      {renderStatusBadge('Optional', entity.secondaryPatterns.length > 0)}
                    </td>
                    <td>
                      <button
                        className="modeler-link"
                        onClick={() => openModal('constraints', entity.id)}
                      >
                        Set Constraints
                      </button>
                    </td>
                    <td>
                      <div className="modeler-status-stack">
                        {renderStatusBadge('CSV', csvReady)}
                        {renderStatusBadge('Fields', fieldsReady)}
                        {renderStatusBadge('Ready', readyForGeneration)}
                      </div>
                    </td>
                    <td>
                      <div className="modeler-actions">
                        <button
                          className="modeler-primary"
                          disabled={!readyForGeneration || loadingEntityId === entity.id}
                          onClick={() => handleGenerate(entity.id)}
                        >
                          {loadingEntityId === entity.id ? 'Generating...' : 'Generate CQL'}
                        </button>
                        <button
                          className="modeler-danger"
                          onClick={() => handleRemoveEntity(entity.id)}
                        >
                          Remove
                        </button>
                      </div>
                      {entity.error && <p className="modeler-error">{entity.error}</p>}
                    </td>
                  </tr>
                  {entity.result && (
                    <tr>
                      <td colSpan="8">
                        {renderResult(entity)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {activeModal === 'fields' && currentEntity && (
        <Modal title={`Field Attributes – ${currentEntity.entityName || 'Unnamed Entity'}`} onClose={closeModal}>
          <div className="modeler-fields-table-wrapper">
            <table className="modeler-fields-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Data Type</th>
                  <th>Cardinality</th>
                  <th>Business Key</th>
                  <th>Mutable</th>
                  <th>Tenant</th>
                  <th>Time Field</th>
                </tr>
              </thead>
              <tbody>
                {modalDraft.map((field, index) => (
                  <tr key={field.name}>
                    <td>{field.name}</td>
                    <td>{field.dataType}</td>
                    <td>
                      <select
                        value={field.cardinality}
                        onChange={(event) => {
                          const next = [...modalDraft]
                          next[index].cardinality = event.target.value
                          setModalDraft(next)
                        }}
                      >
                        {CARDINALITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={field.businessKey}
                        onChange={(event) => {
                          const next = [...modalDraft]
                          next[index].businessKey = event.target.checked
                          setModalDraft(next)
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={field.mutable}
                        onChange={(event) => {
                          const next = [...modalDraft]
                          next[index].mutable = event.target.checked
                          setModalDraft(next)
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={field.tenantField}
                        onChange={(event) => {
                          const next = [...modalDraft]
                          next[index].tenantField = event.target.checked
                          setModalDraft(next)
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={field.timeField}
                        onChange={(event) => {
                          const next = [...modalDraft]
                          next[index].timeField = event.target.checked
                          setModalDraft(next)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modeler-modal-actions">
            <button onClick={closeModal}>Cancel</button>
            <button className="modeler-primary" onClick={saveFields}>
              Save
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'primary' && modalDraft && (
        <Modal title="Primary Access Pattern" onClose={closeModal}>
          <div className="modeler-form-group">
            <label>Description</label>
            <textarea
              value={modalDraft.description}
              onChange={(event) =>
                setModalDraft((draft) => ({ ...draft, description: event.target.value }))
              }
            />
          </div>
          <div className="modeler-form-group">
            <label>Filters</label>
            <button
              type="button"
              className="modeler-link"
              onClick={() =>
                setModalDraft((draft) => ({
                  ...draft,
                  filters: [
                    ...draft.filters,
                    { id: Date.now(), field: '', type: 'EQUALITY', notes: '' }
                  ]
                }))
              }
            >
              + Add Filter
            </button>
            {modalDraft.filters.map((filter, index) => (
              <div key={filter.id} className="modeler-filter-row">
                <select
                  value={filter.field}
                  onChange={(event) => {
                    const next = [...modalDraft.filters]
                    next[index].field = event.target.value
                    setModalDraft((draft) => ({ ...draft, filters: next }))
                  }}
                >
                  <option value="">Select field</option>
                  {currentEntity.fieldsMetadata.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.type}
                  onChange={(event) => {
                    const next = [...modalDraft.filters]
                    next[index].type = event.target.value
                    setModalDraft((draft) => ({ ...draft, filters: next }))
                  }}
                >
                  {FILTER_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Notes"
                  value={filter.notes || ''}
                  onChange={(event) => {
                    const next = [...modalDraft.filters]
                    next[index].notes = event.target.value
                    setModalDraft((draft) => ({ ...draft, filters: next }))
                  }}
                />
                <button
                  type="button"
                  className="modeler-danger"
                  onClick={() =>
                    setModalDraft((draft) => ({
                      ...draft,
                      filters: draft.filters.filter((item) => item.id !== filter.id)
                    }))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="modeler-form-group">
            <label>Sorting</label>
            <button
              type="button"
              className="modeler-link"
              onClick={() =>
                setModalDraft((draft) => ({
                  ...draft,
                  sortFields: [
                    ...draft.sortFields,
                    { id: Date.now(), field: '', direction: 'ASC' }
                  ]
                }))
              }
            >
              + Add Sort Field
            </button>
            {modalDraft.sortFields.map((sortField, index) => (
              <div key={sortField.id} className="modeler-filter-row">
                <select
                  value={sortField.field}
                  onChange={(event) => {
                    const next = [...modalDraft.sortFields]
                    next[index].field = event.target.value
                    setModalDraft((draft) => ({ ...draft, sortFields: next }))
                  }}
                >
                  <option value="">Select field</option>
                  {currentEntity.fieldsMetadata.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sortField.direction}
                  onChange={(event) => {
                    const next = [...modalDraft.sortFields]
                    next[index].direction = event.target.value
                    setModalDraft((draft) => ({ ...draft, sortFields: next }))
                  }}
                >
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </select>
                <button
                  type="button"
                  className="modeler-danger"
                  onClick={() =>
                    setModalDraft((draft) => ({
                      ...draft,
                      sortFields: draft.sortFields.filter((item) => item.id !== sortField.id)
                    }))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="modeler-modal-actions">
            <button onClick={closeModal}>Cancel</button>
            <button className="modeler-primary" onClick={savePrimaryPattern}>
              Save
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'secondary' && modalDraft && (
        <Modal title="Secondary Access Patterns" onClose={closeModal}>
          <button className="modeler-link" onClick={addSecondaryPattern}>
            + Add Pattern
          </button>
          {modalDraft.length === 0 && <p className="modeler-hint">No secondary patterns defined.</p>}
          {modalDraft.map((pattern, patternIndex) => (
            <div key={pattern.id} className="modeler-pattern-card">
              <div className="modeler-pattern-header">
                <label>Pattern {patternIndex + 1}</label>
                <button
                  className="modeler-danger"
                  onClick={() =>
                    setModalDraft((draft) => draft.filter((item) => item.id !== pattern.id))
                  }
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                placeholder="Description"
                value={pattern.description}
                onChange={(event) => {
                  const next = [...modalDraft]
                  next[patternIndex].description = event.target.value
                  setModalDraft(next)
                }}
              />
              <div className="modeler-form-group">
                <label>Filters</label>
                <button
                  type="button"
                  className="modeler-link"
                  onClick={() => {
                    const next = [...modalDraft]
                    next[patternIndex].filters = [
                      ...next[patternIndex].filters,
                      { id: Date.now(), field: '', type: 'EQUALITY', notes: '' }
                    ]
                    setModalDraft(next)
                  }}
                >
                  + Add Filter
                </button>
                {pattern.filters.map((filter, index) => (
                  <div key={filter.id} className="modeler-filter-row">
                    <select
                      value={filter.field}
                      onChange={(event) => {
                        const next = [...modalDraft]
                        next[patternIndex].filters[index].field = event.target.value
                        setModalDraft(next)
                      }}
                    >
                      <option value="">Select field</option>
                      {currentEntity.fieldsMetadata.map((field) => (
                        <option key={field.name} value={field.name}>
                          {field.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filter.type}
                      onChange={(event) => {
                        const next = [...modalDraft]
                        next[patternIndex].filters[index].type = event.target.value
                        setModalDraft(next)
                      }}
                    >
                      {FILTER_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="modeler-danger"
                      onClick={() => {
                        const next = [...modalDraft]
                        next[patternIndex].filters = next[patternIndex].filters.filter(
                          (item) => item.id !== filter.id
                        )
                        setModalDraft(next)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="modeler-modal-actions">
            <button onClick={closeModal}>Cancel</button>
            <button className="modeler-primary" onClick={saveSecondaryPatterns}>
              Save
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'constraints' && modalDraft && (
        <Modal title="Operational Constraints" onClose={closeModal}>
          <div className="modeler-constraints-grid">
            <div className="modeler-form-group">
              <label>Partition Size</label>
              <select
                value={modalDraft.partitionSizeExpectation}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, partitionSizeExpectation: event.target.value }))
                }
              >
                {PARTITION_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="modeler-form-group">
              <label>Query Volume</label>
              <select
                value={modalDraft.queryVolume}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, queryVolume: event.target.value }))
                }
              >
                {QUERY_VOLUME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="modeler-form-group">
              <label>Expected Partition Size (MB)</label>
              <input
                type="number"
                value={modalDraft.expectedPartitionSizeMb}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, expectedPartitionSizeMb: event.target.value }))
                }
              />
            </div>
            <div className="modeler-form-group">
              <label>Keyspace Override</label>
              <input
                type="text"
                value={modalDraft.keyspace}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, keyspace: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="modeler-switch-row">
            <label>
              <input
                type="checkbox"
                checked={modalDraft.multiTenant}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, multiTenant: event.target.checked }))
                }
              />
              Multi-tenant dataset
            </label>
            {modalDraft.multiTenant && (
              <select
                value={modalDraft.tenantField}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, tenantField: event.target.value }))
                }
              >
                <option value="">Select tenant field</option>
                {currentEntity.fieldsMetadata.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="modeler-switch-row">
            <label>
              <input
                type="checkbox"
                checked={modalDraft.timeSeries}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, timeSeries: event.target.checked }))
                }
              />
              Time-series workload
            </label>
            {modalDraft.timeSeries && (
              <select
                value={modalDraft.timeOrderingField}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, timeOrderingField: event.target.value }))
                }
              >
                <option value="">Select timestamp field</option>
                {currentEntity.fieldsMetadata
                  .filter((field) => field.timeField)
                  .map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
          <div className="modeler-constraints-grid">
            <div className="modeler-form-group">
              <label>TTL (seconds)</label>
              <input
                type="number"
                value={modalDraft.ttlSeconds}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, ttlSeconds: event.target.value }))
                }
              />
            </div>
            <div className="modeler-form-group">
              <label>Retention (days)</label>
              <input
                type="number"
                value={modalDraft.retentionDays}
                onChange={(event) =>
                  setModalDraft((draft) => ({ ...draft, retentionDays: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="modeler-modal-actions">
            <button onClick={closeModal}>Cancel</button>
            <button className="modeler-primary" onClick={saveConstraints}>
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const Modal = ({ title, onClose, children }) => (
  <div className="modeler-modal-backdrop">
    <div className="modeler-modal">
      <div className="modeler-modal-header">
        <h3>{title}</h3>
        <button onClick={onClose}>×</button>
      </div>
      <div className="modeler-modal-body">{children}</div>
    </div>
  </div>
)

export default CassandraModeler

