import React from 'react'
import './Tabs.css'

const Tabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'datacatalog', label: 'Data Catalog' },
    { id: 'cassandra', label: 'C* Query' },
    { id: 'yugabyte', label: 'YB Query' },
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

