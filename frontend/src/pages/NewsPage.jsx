import React, { useEffect, useState } from 'react'
import { formatTimeAgo } from '../utils/dateUtils'
import { getArticleImageUrl, getArticleImageFallback } from '../utils/newsUtils'
import '../components/NewsCard.css'

const NewsPage = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchAllNews()
  }, [])

  const fetchAllNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:5000/news')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load news')
      }

      if (!Array.isArray(data.news)) {
        throw new Error('Invalid news payload')
      }

      setArticles(
        data.news.map((article) => ({
          title: article.title || 'Untitled',
          source: article.source || 'Unknown Source',
          publishedAt: article.publishedAt || new Date().toISOString(),
          image: article.image || null,
          description: article.description || '',
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

  const totalPages = Math.max(1, Math.ceil(articles.length / pageSize))

  const visible = articles.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="news-page-container">
      <div className="news-page-header">
        <h1>All Tech News</h1>
        <p className="news-page-sub">Browse the latest technology articles</p>
      </div>

      {loading && <p>Loading articles…</p>}
      {error && (
        <div>
          <p>Error loading articles: {error}</p>
          <button onClick={fetchAllNews}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="news-articles-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {visible.map((article, idx) => (
              <article
                key={idx}
                className="news-article-card"
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
                  <p className="news-article-description">{article.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="news-pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default NewsPage
