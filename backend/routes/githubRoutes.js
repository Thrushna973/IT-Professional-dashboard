import express from 'express'
import axios from 'axios'

const router = express.Router()
const GITHUB_API_BASE = 'https://api.github.com'

// Create axios instance with GitHub token if available
const getGithubHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

router.get('/github/:username', async (req, res) => {
  try {
    const { username } = req.params

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid username provided',
        status: 400
      })
    }

    const cleanUsername = username.trim()
    const headers = getGithubHeaders()

    // Fetch user profile
    const userResponse = await axios.get(`${GITHUB_API_BASE}/users/${cleanUsername}`, {
      headers,
      timeout: 10000
    })

    const userData = userResponse.data

    // Fetch user repositories
    const reposResponse = await axios.get(`${GITHUB_API_BASE}/users/${cleanUsername}/repos`, {
      headers,
      params: {
        sort: 'updated',
        per_page: 100,
        type: 'owner'
      },
      timeout: 10000
    })

    const reposData = reposResponse.data

    if (!Array.isArray(reposData)) {
      throw new Error('Invalid repositories data')
    }

    // Parse top 5 repos sorted by updated_at descending
    const topRepos = reposData
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map((repo) => ({
        name: repo.name,
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count || 0,
        updatedAt: repo.updated_at,
        url: repo.html_url
      }))

    const response = {
      username: userData.login,
      avatar: userData.avatar_url,
      followers: userData.followers || 0,
      following: userData.following || 0,
      publicRepos: userData.public_repos || 0,
      joinedDate: userData.created_at,
      repositories: topRepos
    }

    console.log('GitHub data fetched:', {
      username: cleanUsername,
      reposCount: reposData.length,
      topReposCount: topRepos.length
    })

    return res.json(response)
  } catch (error) {
    let status = 500
    let message = 'Unable to fetch GitHub data'

    if (axios.isAxiosError(error)) {
      if (error.response) {
        status = error.response.status
        if (error.response.status === 404) {
          message = 'GitHub user not found'
        } else if (error.response.status === 403) {
          message = 'GitHub API rate limit exceeded. Please try again later.'
        } else if (error.response.status === 422) {
          message = 'Invalid GitHub username'
        } else {
          message = error.response.data?.message || 'GitHub API error'
        }
      } else if (error.request) {
        status = 502
        message = 'No response from GitHub API'
      } else {
        message = error.message
      }
    } else if (error instanceof Error) {
      message = error.message
    }

    console.error('GitHub fetch error:', message, 'username:', req.params.username)

    return res.status(status).json({
      error: message,
      status
    })
  }
})

export default router
