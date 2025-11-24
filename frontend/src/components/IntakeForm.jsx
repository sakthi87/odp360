import React, { useState } from 'react'
import './IntakeForm.css'

const IntakeForm = () => {
  const [formData, setFormData] = useState({
    // Project Details
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

  const [cassandraRows, setCassandraRows] = useState([])
  const [apiRows, setApiRows] = useState([])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addCassandraRow = () => {
    setCassandraRows(prev => [...prev, {
      id: Date.now(),
      keyspace: '',
      tableName: '',
      sorOfData: '',
      retentionPeriod: '',
      eventRecordCount: '',
      totalRecordCount: '',
      recordSizeInBytes: '',
      volumeInGBCurrentYear: '',
      volumeInGB5Years: ''
    }])
  }

  const removeCassandraRow = (id) => {
    setCassandraRows(prev => prev.filter(row => row.id !== id))
  }

  const updateCassandraRow = (id, field, value) => {
    setCassandraRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const addApiRow = () => {
    setApiRows(prev => [...prev, {
      id: Date.now(),
      accessPattern: '',
      description: '',
      averageTPS: '',
      peakTPS: '',
      slaInMs: ''
    }])
  }

  const removeApiRow = (id) => {
    setApiRows(prev => prev.filter(row => row.id !== id))
  }

  const updateApiRow = (id, field, value) => {
    setApiRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const submissionData = {
      projectDetails: formData,
      cassandraDetails: cassandraRows,
      apiDetails: apiRows
    }
    console.log('Form submission:', submissionData)
    // TODO: Send to backend API
    alert('Form submitted successfully! (Check console for data)')
  }

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

          {/* Cassandra Details Section */}
          <div className="details-section">
            <div className="section-header">
              <h3>Cassandra Details</h3>
              <button type="button" className="add-button" onClick={addCassandraRow}>
                <span className="plus-icon">+</span>
              </button>
            </div>
            
            {cassandraRows.length > 0 && (
              <div className="table-container">
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Keyspace</th>
                      <th>TableName</th>
                      <th>SOR of Data</th>
                      <th>Retention Period</th>
                      <th>Event Record Count</th>
                      <th>Total Record Count</th>
                      <th>Record Size in Bytes</th>
                      <th>Volume in GB(Current Year)</th>
                      <th>Volume in GB(5 years)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cassandraRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            value={row.keyspace}
                            onChange={(e) => updateCassandraRow(row.id, 'keyspace', e.target.value)}
                            placeholder="Keyspace"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.tableName}
                            onChange={(e) => updateCassandraRow(row.id, 'tableName', e.target.value)}
                            placeholder="Table Name"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.sorOfData}
                            onChange={(e) => updateCassandraRow(row.id, 'sorOfData', e.target.value)}
                            placeholder="SOR"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.retentionPeriod}
                            onChange={(e) => updateCassandraRow(row.id, 'retentionPeriod', e.target.value)}
                            placeholder="Retention"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.eventRecordCount}
                            onChange={(e) => updateCassandraRow(row.id, 'eventRecordCount', e.target.value)}
                            placeholder="Event Count"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.totalRecordCount}
                            onChange={(e) => updateCassandraRow(row.id, 'totalRecordCount', e.target.value)}
                            placeholder="Total Count"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.recordSizeInBytes}
                            onChange={(e) => updateCassandraRow(row.id, 'recordSizeInBytes', e.target.value)}
                            placeholder="Size (Bytes)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.volumeInGBCurrentYear}
                            onChange={(e) => updateCassandraRow(row.id, 'volumeInGBCurrentYear', e.target.value)}
                            placeholder="GB (Current)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.volumeInGB5Years}
                            onChange={(e) => updateCassandraRow(row.id, 'volumeInGB5Years', e.target.value)}
                            placeholder="GB (5 Years)"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeCassandraRow(row.id)}
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

          {/* API Details Section */}
          <div className="details-section">
            <div className="section-header">
              <h3>API Details</h3>
              <button type="button" className="add-button" onClick={addApiRow}>
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
                          <input
                            type="text"
                            value={row.accessPattern}
                            onChange={(e) => updateApiRow(row.id, 'accessPattern', e.target.value)}
                            placeholder="Access Pattern"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => updateApiRow(row.id, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.averageTPS}
                            onChange={(e) => updateApiRow(row.id, 'averageTPS', e.target.value)}
                            placeholder="Average TPS"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.peakTPS}
                            onChange={(e) => updateApiRow(row.id, 'peakTPS', e.target.value)}
                            placeholder="Peak TPS"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.slaInMs}
                            onChange={(e) => updateApiRow(row.id, 'slaInMs', e.target.value)}
                            placeholder="SLA (ms)"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeApiRow(row.id)}
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

