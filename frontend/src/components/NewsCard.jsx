import React, { useEffect, useState } from 'react'
import { formatTimeAgo } from '../utils/dateUtils'
import { getArticleImageUrl, getArticleImageFallback } from '../utils/newsUtils'
import './NewsCard.css'
import { useNavigate } from 'react-router-dom'

const NewsCard = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const navigate = useNavigate()

  const fetchNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:5000/news')
      const data = await response.json()

      console.log('News response payload:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load news')
      }

      if (!Array.isArray(data.news)) {
        throw new Error('Invalid news payload')
      }

      if (data.news.length === 0) {
        throw new Error('No news articles found')
      }

      const topArticles = data.news.slice(0, 3)

      setArticles(
        topArticles.map((article) => ({
          title: article.title || 'Untitled',
          source: article.source || 'Unknown Source',
          publishedAt: article.publishedAt || new Date().toISOString(),
          image: article.image || null,
          url: article.url || '#'
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="news-card news-card-container">
        <div className="news-card-header">
          <h2 className="news-card-title">Tech News</h2>
          <button
            className="news-view-all-btn"
            onClick={() => navigate('/news')}
          >
            View All
          </button>
        </div>

        <div className="news-articles-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="news-article-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-content">
                <div className="skeleton-title" />
                <div className="skeleton-meta" />
                <div className="skeleton-time" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="news-card news-card-container">
        <div className="news-card-header">
          <h2 className="news-card-title">Tech News</h2>
          <button
            className="news-view-all-btn"
            onClick={() => navigate('/news')}
          >
            View All
          </button>
        </div>

        <div className="news-error-state">
          <p className="news-error-icon">📰</p>
          <h3>News update failed</h3>
          <p>{error}</p>
          <button className="news-retry-btn" onClick={fetchNews}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="news-card news-card-container">
      <div className="news-card-header">
        <h2 className="news-card-title">Tech News</h2>
          <button
            className="news-view-all-btn"
            onClick={() => navigate('/news')}
          >
            View All
          </button>
      </div>

      <div className="news-articles-grid">
        {articles.map((article, index) => (
          <div
            key={index}
            className="news-article-card"
            onClick={() => {
              window.open(article.url, '_blank', 'noopener,noreferrer')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                window.open(article.url, '_blank', 'noopener,noreferrer')
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Read article: ${article.title}`}
          >
            <div className="news-article-image">
              <img
                src={getArticleImageUrl(article)}
                alt={article.title}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = getArticleImageFallback()
                }}
              />
            </div>

            <div className="news-article-content">
              <h3 className="news-article-title">{article.title}</h3>

              <div className="news-article-meta">
                <span className="news-article-source">{article.source}</span>
                <span className="news-article-time">{formatTimeAgo(article.publishedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewsCard
