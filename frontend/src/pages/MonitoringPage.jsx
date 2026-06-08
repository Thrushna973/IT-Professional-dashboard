import React from 'react'
import SystemCard from '../components/SystemCard'
import './MonitoringPage.css'

const MonitoringPage = () => {
  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="page-subtitle">Monitoring</p>
          <h1 className="page-title">System Health & Performance</h1>
        </div>
      </header>

      <section className="page-grid page-grid--full">
        <div className="page-placeholder page-placeholder--full">
          <SystemCard />
        </div>
      </section>
    </main>
  )
}

export default MonitoringPage
