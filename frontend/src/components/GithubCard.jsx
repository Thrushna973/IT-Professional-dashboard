import React, { useEffect, useState } from 'react'
import './GithubCard.css'

const GithubCard = ({ setGithubUser }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [username, setUsername] = useState('octocat')
  const [inputValue, setInputValue] = useState('octocat')

  useEffect(() => {
    fetchGithubData('octocat')
  }, [])

  const token = import.meta.env.VITE_GITHUB_TOKEN;



const fetchGithubData = async (user = username) => {
  setLoading(true)
  setError(null)

  try {
    const response = await fetch(
      `https://api.github.com/users/${user}`,
    
    );

    const result = await response.json()

    console.log("Status:", response.status)
    console.log("GitHub Response:", result)

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch GitHub data')
    }

    setData({
      avatar: result.avatar_url,
      username: result.login,
      followers: result.followers,
      following: result.following,
      publicRepos: result.public_repos
    })
    setGithubUser({
  username: result.login,
  avatar: result.avatar_url
});

    setUsername(user)
  } catch (err) {
    setError(err.message || 'Failed to fetch GitHub data')
    console.error(err)
  } finally {
    setLoading(false)
  }
}

// setData({
//   avatar: result.avatar_url,
//   username: result.login,
//   followers: result.followers,
//   following: result.following,
//   publicRepos: result.public_repos
// });



  const handleSearch = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      fetchGithubData(inputValue.trim())
    }
  }

  if (loading) {
    return (
      <div className="github-card">
        <h2>GitHub Profile</h2>
        <form onSubmit={handleSearch} className="github-search-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter GitHub username..."
            className="github-search-input"
          />
          <button type="submit" className="github-search-btn" disabled>
            Search
          </button>
        </form>
        <div className="github-card-loading">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isRateLimit = error.includes('rate limit')
    return (
      <div className="github-card">
        <h2>GitHub Profile</h2>
        <form onSubmit={handleSearch} className="github-search-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter GitHub username..."
            className="github-search-input"
          />
          <button type="submit" className="github-search-btn">
            Search
          </button>
        </form>
        <div className="github-card-error">
          <p>Error: {error}</p>
          {isRateLimit && (
            <p className="github-error-tip">
              💡 Tip: Add a GitHub Personal Access Token to your .env file to increase rate limits.
              Get one at: https://github.com/settings/tokens
            </p>
          )}
          <button onClick={() => fetchGithubData(inputValue)}>Retry</button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="github-card">
        <h2>GitHub Profile</h2>
        <form onSubmit={handleSearch} className="github-search-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter GitHub username..."
            className="github-search-input"
          />
          <button type="submit" className="github-search-btn">
            Search
          </button>
        </form>
        <div className="github-card-loading">
          <p>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="github-card">
      <h2>GitHub Profile</h2>
      <form onSubmit={handleSearch} className="github-search-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter GitHub username..."
          className="github-search-input"
        />
        <button type="submit" className="github-search-btn">
          Search
        </button>
      </form>

      <div className="github-profile">
        <img src={data.avatar} alt={data.username} className="github-avatar" />

        <h3 className="github-username">{data.username}</h3>
      </div>

      <div className="github-stats">
        <div className="github-stat">
          <span className="github-stat-label">Followers</span>
          <span className="github-stat-value">{data.followers}</span>
        </div>
        <div className="github-stat">
          <span className="github-stat-label">Following</span>
          <span className="github-stat-value">{data.following}</span>
        </div>
        <div className="github-stat">
          <span className="github-stat-label">Repositories</span>
          <span className="github-stat-value">{data.publicRepos}</span>
        </div>
      </div>

      {data.repositories && data.repositories.length > 0 && (
        <div className="github-repositories">
          <h4>Top Repositories</h4>
          <ul className="github-repo-list">
            {data.repositories.slice(0, 3).map((repo, index) => (
              <li
                key={index}
                className="github-repo-item"
                onClick={() => window.open(repo.url, '_blank', 'noopener,noreferrer')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    window.open(repo.url, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                <div className="github-repo-info">
                  <p className="github-repo-name">
                    <span>{repo.name}</span>
                  </p>
                  <div className="github-repo-meta">
                    {repo.language && <span className="github-repo-language">{repo.language}</span>}
                    <span className="github-repo-stars">{repo.stars}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default GithubCard
