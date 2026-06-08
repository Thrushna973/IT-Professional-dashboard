import React from 'react'
import AIChat from '../components/AIChat'
import './AssistantPage.css'

const AssistantPage = () => {
  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="page-subtitle">AI Assistant</p>
          <h1 className="page-title">Intelligent Assistance & Automation</h1>
        </div>
      </header>

      <section className="page-grid page-grid--full">
        <div className="page-placeholder page-placeholder--full">
          <AIChat />
        </div>
      </section>
    </main>
  )
}

export default AssistantPage
