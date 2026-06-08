import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './SearchResultsPage.css'

const NEWS_URL = 'http://localhost:5000/news'
const TASKS_URL = 'http://localhost:5000/tasks'
const GITHUB_URL = 'http://localhost:5000/github/octocat'

const formatDate = (value) => {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q')?.trim() || ''

  const [tasks, setTasks] = useState([])
  const [news, setNews] = useState([])
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const normalizedQuery = query.toLowerCase()
  const isTaskQuery = /(^|\s)(task|tasks)\b/.test(normalizedQuery)
  const isRepoQuery = /(^|\s)(github|repo|repos|repository|repositories)\b/.test(normalizedQuery)
  const isNewsQuery = /(^|\s)(news|headline|headlines)\b/.test(normalizedQuery)
  const isEventQuery = /(^|\s)(event|events|meeting|calendar)\b/.test(normalizedQuery)

  useEffect(() => {
    let isActive = true
    setLoading(true)
    setError(null)

    const fetchTasks = async () => {
      const response = await fetch(TASKS_URL)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load tasks')
      }
      return Array.isArray(data) ? data : []
    }

    const fetchNews = async () => {
      const response = await fetch(NEWS_URL)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load news')
      }
      if (!Array.isArray(data.news)) {
        throw new Error('Invalid news payload')
      }
      return data.news.map((article) => ({
        title: article.title || 'Untitled',
        source: article.source || 'Unknown Source',
        publishedAt: article.publishedAt || new Date().toISOString(),
        url: article.url || '#',
        description: article.description || '',
      }))
    }

    const fetchGithub = async () => {
      const response = await fetch(GITHUB_URL)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load GitHub data')
      }
      return Array.isArray(data.repositories) ? data.repositories : []
    }

    Promise.all([fetchTasks(), fetchNews(), fetchGithub()])
      .then(([fetchedTasks, fetchedNews, fetchedRepos]) => {
        if (!isActive) return
        setTasks(fetchedTasks)
        setNews(fetchedNews)
        setRepos(fetchedRepos)
      })
      .catch((err) => {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Search failed')
      })
      .finally(() => {
        if (!isActive) return
        setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [query])

  const filteredTasks = useMemo(() => {
    if (!query) return []
    if (isTaskQuery) return tasks
    const lowerQuery = query.toLowerCase()
    return tasks.filter((task) => {
      const title = task.title || ''
      const description = task.description || ''
      return (
        title.toLowerCase().includes(lowerQuery) ||
        description.toLowerCase().includes(lowerQuery) ||
        (task.status || '').toLowerCase().includes(lowerQuery)
      )
    })
  }, [query, tasks, isTaskQuery])

  const filteredEvents = useMemo(() => {
    if (!query) return []
    if (isEventQuery) return tasks.filter((task) => task.dueDate)
    const lowerQuery = query.toLowerCase()
    return tasks
      .filter((task) => task.dueDate)
      .filter((task) => {
        const title = task.title || ''
        const dueDate = String(task.dueDate || '')
        return (
          title.toLowerCase().includes(lowerQuery) ||
          dueDate.toLowerCase().includes(lowerQuery)
        )
      })
  }, [query, tasks, isEventQuery])

  const filteredRepos = useMemo(() => {
    if (!query) return []
    if (isRepoQuery) return repos
    const lowerQuery = query.toLowerCase()
    return repos.filter((repo) => {
      const name = repo.name || ''
      const description = repo.description || ''
      return (
        name.toLowerCase().includes(lowerQuery) ||
        description.toLowerCase().includes(lowerQuery)
      )
    })
  }, [query, repos, isRepoQuery])

  const filteredNews = useMemo(() => {
    if (!query) return []
    if (isNewsQuery) return news
    const lowerQuery = query.toLowerCase()
    return news.filter((article) => {
      const title = article.title || ''
      const source = article.source || ''
      const description = article.description || ''
      return (
        title.toLowerCase().includes(lowerQuery) ||
        source.toLowerCase().includes(lowerQuery) ||
        description.toLowerCase().includes(lowerQuery)
      )
    })
  }, [query, news, isNewsQuery])

  const hasResults = [filteredTasks, filteredEvents, filteredRepos, filteredNews].some((section) => section.length > 0)

  return (
    <main className="search-results-page">
      <header className="search-results-header">
        <div>
          <p className="search-results-subtitle">Search</p>
          <h1 className="search-results-title">Results for “{query || 'all'}”</h1>
        </div>
        <button className="search-results-back" type="button" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      {loading ? (
        <div className="search-loading">Loading search results…</div>
      ) : error ? (
        <div className="search-error">{error}</div>
      ) : (
        <div className="search-results-grid">
          {!query ? (
            <div className="search-no-query">
              Start typing in the search bar above to find tasks, GitHub repositories, news headlines, and events.
            </div>
          ) : !hasResults ? (
            <div className="search-no-results">No search results were found for “{query}”.</div>
          ) : (
            <>
              <section className="search-section">
                <div className="search-section-header">
                  <h2>Tasks</h2>
                  <span>{filteredTasks.length} found</span>
                </div>
                {filteredTasks.length > 0 ? (
                  <ul className="search-list">
                    {filteredTasks.map((task) => (
                      <li key={task.id} className="search-item">
                        <strong>{task.title}</strong>
                        <p>{task.description || task.status || 'Task item'}</p>
                        {task.dueDate && <span className="search-meta">Due {formatDate(task.dueDate)}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="search-empty">No matching tasks.</div>
                )}
              </section>

              <section className="search-section">
                <div className="search-section-header">
                  <h2>Events</h2>
                  <span>{filteredEvents.length} found</span>
                </div>
                {filteredEvents.length > 0 ? (
                  <ul className="search-list">
                    {filteredEvents.map((event) => (
                      <li key={`${event.id}-${event.dueDate}`} className="search-item">
                        <strong>{event.title}</strong>
                        <p>{event.status || 'Event'}</p>
                        <span className="search-meta">{formatDate(event.dueDate)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="search-empty">No matching events.</div>
                )}
              </section>

              <section className="search-section">
                <div className="search-section-header">
                  <h2>GitHub Repositories</h2>
                  <span>{filteredRepos.length} found</span>
                </div>
                {filteredRepos.length > 0 ? (
                  <ul className="search-list">
                    {filteredRepos.map((repo) => (
                      <li
                        key={repo.name}
                        className="search-item"
                        onClick={() => window.open(repo.url || '#', '_blank', 'noopener,noreferrer')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            window.open(repo.url || '#', '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        <strong>{repo.name}</strong>
                        <p>{repo.description || 'No description available.'}</p>
                        <span className="search-meta">{repo.language || 'Unknown language'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="search-empty">No matching GitHub repositories.</div>
                )}
              </section>

              <section className="search-section">
                <div className="search-section-header">
                  <h2>News Headlines</h2>
                  <span>{filteredNews.length} found</span>
                </div>
                {filteredNews.length > 0 ? (
                  <ul className="search-list">
                    {filteredNews.map((article, index) => (
                      <li
                        key={`${article.title}-${index}`}
                        className="search-item"
                        onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            window.open(article.url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        <strong>{article.title}</strong>
                        <p>{article.source}</p>
                        <span className="search-meta">{formatDate(article.publishedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="search-empty">No matching news headlines.</div>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </main>
  )
}

export default SearchResultsPage
