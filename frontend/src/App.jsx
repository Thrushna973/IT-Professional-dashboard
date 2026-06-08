import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AssistantPage from './pages/AssistantPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import GithubPage from './pages/GithubPage.jsx'
import MonitoringPage from './pages/MonitoringPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import SearchResultsPage from './pages/SearchResultsPage.jsx'
import { WidgetManagerProvider } from './components/WidgetManager.jsx'
import './App.css'

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  return (
    <WidgetManagerProvider>
      <BrowserRouter>
        <div className="app-container">
          <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
          <div className="main-layout">
            <Sidebar isOpen={sidebarOpen} />
            <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/github" element={<GithubPage />} />
                <Route path="/monitoring" element={<MonitoringPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </WidgetManagerProvider>
  )
}

export default App