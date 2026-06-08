import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const Header = ({ toggleSidebar, sidebarOpen, githubUser }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [githubName, setGithubName] = useState('Alex Morgan')
  const navigate = useNavigate()
  console.log("Header githubUser prop:", githubUser)

  useEffect(() => {
    const fetchGithubName = async () => {
      try {
        const response = await fetch('http://localhost:5000/github/octocat')
        const result = await response.json()
        if (response.ok && result?.username) {
          setGithubName(result.username)
        }
      } catch (error) {
        console.error('Unable to load GitHub username:', error)
      }
    }

    fetchGithubName()
  }, [])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    const lowerQuery = trimmedQuery.toLowerCase()
    if (/(^|\s)(task|tasks)\b/.test(lowerQuery)) {
      navigate('/tasks')
      return
    }
    if (/(^|\s)(github|repo|repos|repository|repositories)\b/.test(lowerQuery)) {
      navigate('/github')
      return
    }
    if (/(^|\s)(monitor|monitoring|system|health|performance)\b/.test(lowerQuery)) {
      navigate('/monitoring')
      return
    }
    if (/(^|\s)(news|headline|headlines)\b/.test(lowerQuery)) {
      navigate('/news')
      return
    }
    if (/(^|\s)(assistant|ai|chat)\b/.test(lowerQuery)) {
      navigate('/assistant')
      return
    }
    if (/(^|\s)(settings|preference|preferences|config|configuration)\b/.test(lowerQuery)) {
      navigate('/settings')
      return
    }

    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  return (
    <header className="header-shell">
      <div className="header-group header-left">
        <button
          className="header-icon-btn"
          type="button"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          onClick={toggleSidebar}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className="header-brand">
          <p className="header-brand__title">IT Professional AI Dashboard</p>
        </div>
      </div>

      <div className="header-group header-center">
        <form className="header-search" onSubmit={handleSearchSubmit}>
          <label htmlFor="dashboard-search" className="header-search-label">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 18C15.4183 18 19 14.4183 19 10C19 5.58172 15.4183 2 11 2C6.58172 2 3 5.58172 3 10C3 14.4183 6.58172 18 11 18Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </label>
          <input
            id="dashboard-search"
            className="header-search__input"
            type="search"
            placeholder="Search tasks, repos, news, events..."
            aria-label="Search dashboard"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit" className="header-search__button">
            Search
          </button>
        </form>
      </div>

      <div className="header-group header-right">
        <button className="icon-button" type="button" aria-label="View notifications">
          <span className="icon-bell" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8C18 5.23858 15.7614 3 13 3H11C8.23858 3 6 5.23858 6 8V12C6 13.105 5.47715 14.1566 4.58579 14.8787L4 15.4V16H20V15.4L19.4142 14.8787C18.5228 14.1566 18 13.105 18 12V8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 20C9 21.1046 9.89543 22 11 22H13C14.1046 22 15 21.1046 15 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          
        </button>


        <div className="profile-card" role="button" tabIndex={0}>
          <div className="profile-avatar">AI</div>
          <div className="profile-copy">
            <span className="profile-name">Octocat</span>
            <span className="profile-role">IT Professional</span>
          </div>
          <span className="profile-arrow" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 6L8 9.5L11.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header
