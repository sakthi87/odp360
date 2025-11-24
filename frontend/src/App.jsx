import React, { useState, useEffect } from 'react'
import CassandraBrowser from './components/CassandraBrowser'
import YSQLBrowser from './components/YSQLBrowser'
import GraphQLBrowser from './components/GraphQLBrowser'
import KafkaBrowser from './components/KafkaBrowser'
import DataCatalog from './components/DataCatalog'
import IntakeForm from './components/IntakeForm'
import Tabs from './components/Tabs'
import './App.css'

function App() {
  const [logo, setLogo] = useState(null)
  const [activeTab, setActiveTab] = useState('datacatalog')

  useEffect(() => {
    // Try to load logo - if it doesn't exist, app works without it
    import('./assets/logo.png')
      .then((logoModule) => setLogo(logoModule.default))
      .catch(() => {
        // Logo file not found - that's okay, app works without it
        console.log('Logo not found. Place logo.png in src/assets/ to display it.')
      })
  }, [])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'datacatalog':
        return <DataCatalog />
      case 'intake':
        return <IntakeForm />
      case 'cassandra':
        return <CassandraBrowser />
      case 'yugabyte':
        return <YSQLBrowser />
      case 'graphql':
        return <GraphQLBrowser />
      case 'kafka':
        return <KafkaBrowser />
      case 'deployment':
        return (
          <div className="tab-placeholder">
            <h2>Deployment</h2>
            <p>Coming soon</p>
          </div>
        )
      default:
        return (
          <div className="tab-placeholder">
            <h2>Data Catalog</h2>
            <p>Coming soon</p>
          </div>
        )
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        {logo && <img src={logo} alt="ODP Logo" className="app-logo" />}
        <h1>Online Data Platform</h1>
      </header>
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="app-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default App

