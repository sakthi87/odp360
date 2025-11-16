import React from 'react'
import CassandraBrowser from './components/CassandraBrowser'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Cassandra Browser</h1>
      </header>
      <div className="app-content">
        <CassandraBrowser />
      </div>
    </div>
  )
}

export default App

