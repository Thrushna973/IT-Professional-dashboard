import React, { useState } from 'react'
import './SettingsPage.css'

const SettingsPage = () => {
  const [enableDarkMode, setEnableDarkMode] = useState(true)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [showGithubInsights, setShowGithubInsights] = useState(true)

  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="page-subtitle">Settings</p>
          <h1 className="page-title">Preferences & Configuration</h1>
        </div>
      </header>

      <section className="page-grid page-grid--settings">
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <p className="settings-card-label">Appearance</p>
              <h2 className="settings-card-title">Theme & interface</h2>
            </div>
            <span className="settings-card-badge">Core</span>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-title">Dark mode</p>
              <p className="settings-row-description">Keep the dashboard in low-light mode for better focus.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={enableDarkMode}
                onChange={() => setEnableDarkMode((prev) => !prev)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-title">Compact layout</p>
              <p className="settings-row-description">Use tighter spacing for cards and page elements.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={false} readOnly />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <p className="settings-card-label">Notifications</p>
              <h2 className="settings-card-title">Alerts & updates</h2>
            </div>
            <span className="settings-card-badge">Optional</span>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-title">Activity alerts</p>
              <p className="settings-row-description">Receive updates for new GitHub activity and system events.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={enableNotifications}
                onChange={() => setEnableNotifications((prev) => !prev)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-title">Auto update</p>
              <p className="settings-row-description">Automatically refresh dashboard data and extensions.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoUpdate}
                onChange={() => setAutoUpdate((prev) => !prev)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <button className="settings-action-btn" type="button">
            Save changes
          </button>
        </div>

        <div className="settings-card settings-card--wide">
          <div className="settings-card-header">
            <div>
              <p className="settings-card-label">Integrations</p>
              <h2 className="settings-card-title">Connected services</h2>
            </div>
            <span className="settings-card-badge">Connected</span>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-title">GitHub insights</p>
              <p className="settings-row-description">Enable deep GitHub metrics within the dashboard.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showGithubInsights}
                onChange={() => setShowGithubInsights((prev) => !prev)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row settings-row--compact">
            <p className="settings-row-title">Profile name</p>
            <input className="settings-text-input" type="text" placeholder="GitHub username or display name" />
          </div>

          <div className="settings-row settings-row--compact">
            <p className="settings-row-title">Workspace mode</p>
            <select className="settings-select" defaultValue="developer">
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="ops">Operations</option>
            </select>
          </div>
        </div>
      </section>
    </main>
  )
}

export default SettingsPage
