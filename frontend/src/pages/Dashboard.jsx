import React, { useEffect, useState } from 'react'
import './Dashboard.css'
import { useWidgetManager } from '../components/WidgetManager'
import WeatherCard from '../components/WeatherCard'
import NewsCard from '../components/NewsCard'
import GithubCard from '../components/GithubCard'
import TaskCard from '../components/TaskCard'
import SystemCard from '../components/SystemCard'
import { EventsCard } from '../components/WidgetManager'
import AIChat from '../components/AIChat'
import Header from '../components/Header'

const STORAGE_KEY = 'dashboard_widget_visibility'

const Dashboard = () => {
  const { visibleWidgetIds, openWidgetModal } = useWidgetManager()
  const [enabledWidgets, setEnabledWidgets] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : visibleWidgetIds
    } catch {
      return visibleWidgetIds
    }
  })
  const [githubUser, setGithubUser] = useState({
  username: "Alex Morgan",
  avatar: ""
});



  useEffect(() => {
    setEnabledWidgets(visibleWidgetIds)
  }, [visibleWidgetIds])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return
      try {
        setEnabledWidgets(event.newValue ? JSON.parse(event.newValue) : [])
      } catch {
        setEnabledWidgets([])
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <main className="dashboard-page">
      <div className="dashboard-layout">
        <Header githubUser={githubUser} />

            {/* <GithubCard
              githubUser={githubUser}
              setGithubUser={setGithubUser}
            /> */}
        <section className="dashboard-main">
          <div className="dashboard-topbar">
            <div>
              <p className="dashboard-subtitle">AI Operations Dashboard</p>
              <h1 className="dashboard-title">Live systems, insights, and mission control</h1>
            </div>
            <button className="dashboard-add-widget-btn" type="button" onClick={openWidgetModal}>
              Customize widgets
            </button>
          </div>

          <div className="dashboard-left-grid">
            {enabledWidgets.includes('weather') && (
              <div className="dashboard-card card-weather">
                <WeatherCard />
              </div>
            )}

            {enabledWidgets.includes('news') && (
              <div className="dashboard-card card-news">
                <NewsCard />
              </div>
            )}

            {enabledWidgets.includes('github') && (
              <div className="dashboard-card card-github">
                <GithubCard         githubUser={githubUser}
              setGithubUser={setGithubUser} />
              </div>
            )}

            {enabledWidgets.includes('system') && (
              <div className="dashboard-card card-system">
                <SystemCard />
              </div>
            )}

            {enabledWidgets.includes('tasks') && (
              <div className="dashboard-card card-task">
                <TaskCard />
              </div>
            )}

            {enabledWidgets.includes('events') && (
              <div className="dashboard-card card-events">
                <EventsCard />
              </div>
            )}

            {enabledWidgets.length === 0 && (
              <div className="dashboard-card dashboard-empty-state">
                <h2>No widgets selected</h2>
                <p>Use the Customize widgets button to enable your dashboard cards.</p>
              </div>
            )}
          </div>

          <aside className="dashboard-right-panel">
            <AIChat />
          </aside>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
