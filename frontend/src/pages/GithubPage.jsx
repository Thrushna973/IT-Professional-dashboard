import React from 'react'
import GithubCard from '../components/GithubCard'
import './GithubPage.css'

const GithubPage = () => {
  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="page-subtitle">GitHub</p>
          <h1 className="page-title">Repository & Code Analytics</h1>
        </div>
      </header>

      <section className="page-grid page-grid--full">
        <div className="page-placeholder page-placeholder--full">
          <GithubCard />
        </div>
      </section>
    </main>
  )
}

export default GithubPage
