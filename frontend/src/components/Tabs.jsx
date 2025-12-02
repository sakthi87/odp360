import React from 'react'
import './Tabs.css'

const Tabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'datacatalog', label: 'Data Catalog' },
    { id: 'intake', label: 'ODP Intake' },
    { id: 'intakelist', label: 'Intake List' },
    { id: 'cassandra', label: 'CQL' },
    { id: 'yugabyte', label: 'YSQL' },
    { id: 'graphql', label: 'GraphQL' },
    { id: 'kafka', label: 'Kafka' },
    { id: 'deployment', label: 'Deployment' }
  ]

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default Tabs

