import express from 'express'
import axios from 'axios'
import { generateResponse } from '../services/aiService.js'

const router = express.Router()
const PORT = process.env.PORT || 5000
const BASE_URL = `http://localhost:${PORT}`
const DEFAULT_CITY = 'Hyderabad'
const DEFAULT_GITHUB_USERNAME = 'octocat'

const normalizeMessage = (message) => String(message || '').trim()

const isTaskCreateRequest = (message) => /\b(?:create|add|make|new)\s+(?:task\s+)?/i.test(message) || /\bfinish\s+\w+/i.test(message)
const isTaskDeleteRequest = (message) => /\b(?:delete|remove|clear|done)\s+(?:task\s+)?/i.test(message)
const isTaskListRequest = (message) => /\b(?:show|list|view|what are|my)\b.*\btasks\b/i.test(message) || /\bpending\s+tasks\b/i.test(message)
const isTaskRequest = (message) => isTaskCreateRequest(message) || isTaskDeleteRequest(message) || isTaskListRequest(message)
const isSystemRequest = (message) => /\b(cpu usage|system status|system health|ram usage|memory usage|disk usage|disk space|system info|cpu|ram|memory|disk)\b/i.test(message)
const isWeatherRequest = (message) => /\b(weather|forecast|current weather)\b/i.test(message)
const isNewsRequest = (message) => /\b(latest tech news|show ai news|technology updates|tech news|news)\b/i.test(message)
const isGithubRequest = (message) => /\b(github|repo|repository|repositories|profile|stats)\b/i.test(message)

const extractCity = (message) => {
  const weatherInMatch = message.match(/weather in ([A-Za-z\s]+)/i)
  if (weatherInMatch && weatherInMatch[1]) {
    return weatherInMatch[1].trim()
  }

  const currentWeatherInMatch = message.match(/current weather in ([A-Za-z\s]+)/i)
  if (currentWeatherInMatch && currentWeatherInMatch[1]) {
    return currentWeatherInMatch[1].trim()
  }

  return DEFAULT_CITY
}

const extractTaskTitle = (message) => {
  const createMatch = message.match(/(?:create|add|make|new)\s+(?:task\s+)?(.+)/i)
  if (createMatch && createMatch[1]) {
    return createMatch[1].trim()
  }

  const finishMatch = message.match(/\bfinish\s+(.+)/i)
  if (finishMatch && finishMatch[1]) {
    return finishMatch[1].trim()
  }

  const deleteMatch = message.match(/(?:delete|remove|clear|done)\s+(?:task\s+)?(.+)/i)
  if (deleteMatch && deleteMatch[1]) {
    return deleteMatch[1].trim()
  }

  return ''
}

const extractGithubUsername = (message) => {
  const userMatch = message.match(/(?:github(?: profile| user| username)?(?: for)?|profile for|user)\s+([A-Za-z0-9-_]+)/i)
  if (userMatch && userMatch[1]) {
    const candidate = userMatch[1].trim().toLowerCase()
    const invalidTokens = ['repositories', 'repos', 'profile', 'stats', 'activity', 'user', 'username']
    if (!invalidTokens.includes(candidate)) {
      return userMatch[1].trim()
    }
  }

  return DEFAULT_GITHUB_USERNAME
}

const createDefaultDueDate = () => {
  const due = new Date()
  due.setDate(due.getDate() + 2)
  return due.toISOString()
}

router.post('/ai/chat', async (req, res) => {
  const message = normalizeMessage(req.body?.message)
  if (!message) {
    return res.status(400).json({ error: 'Message cannot be empty', status: 400 })
  }

// router.get('/ai-test', async (req, res) => {
//   res.json({
//     keyExists: !!process.env.GEMINI_API_KEY,
//     keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10)
//   })
// })

  try {
    if (isTaskCreateRequest(message)) {
      const title = extractTaskTitle(message) || 'New task'
      const taskPayload = {
        title,
        status: 'todo',
        priority: 'medium',
        dueDate: createDefaultDueDate(),
        completed: false
      }

      const taskResponse = await axios.post(`${BASE_URL}/tasks`, taskPayload)
      const task = taskResponse.data
      const dueDateText = new Date(task.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })

      return res.json({
        reply: `Task created: ${task.title} (status: ${task.status}, priority: ${task.priority}, due: ${dueDateText}).`
      })
    }

    if (isTaskDeleteRequest(message)) {
      const titleToDelete = extractTaskTitle(message)
      if (!titleToDelete) {
        return res.json({ reply: 'Please specify which task you want to delete.' })
      }

      const tasksResponse = await axios.get(`${BASE_URL}/tasks`)
      const tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : []
      const matchingTask = tasks.find((task) =>
        task.title.toLowerCase().includes(titleToDelete.toLowerCase()) ||
        titleToDelete.toLowerCase().includes(task.title.toLowerCase())
      )

      if (!matchingTask) {
        return res.json({ reply: `Task "${titleToDelete}" not found. No tasks were deleted.` })
      }

      await axios.delete(`${BASE_URL}/tasks/${matchingTask.id}`)
      return res.json({
        reply: `Task deleted: "${matchingTask.title}".`
      })
    }

    if (isTaskListRequest(message)) {
      const tasksResponse = await axios.get(`${BASE_URL}/tasks`)
      const tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : []
      const pendingOnly = /\bpending\b/i.test(message)
      const filtered = pendingOnly
        ? tasks.filter((task) => task.status !== 'done' && !task.completed)
        : tasks

      if (!filtered.length) {
        return res.json({ reply: pendingOnly ? 'No pending tasks found.' : 'No tasks found.' })
      }

      const summary = filtered
        .slice(0, 5)
        .map((task, index) => {
          const status = task.status || 'todo'
          const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'No due date'
          return `${index + 1}. ${task.title} (${status}, due ${due})`
        })
        .join('\n')

      const reply = pendingOnly
        ? `Pending tasks:\n${summary}`
        : `You have ${filtered.length} task${filtered.length === 1 ? '' : 's'}:\n${summary}`

      return res.json({ reply })
    }

    if (isSystemRequest(message)) {
      const systemResponse = await axios.get(`${BASE_URL}/system`)
      const systemData = systemResponse.data
      const cpuUsage = systemData.cpu?.usage != null ? `${systemData.cpu.usage}%` : 'N/A'
      const cpuInfo = systemData.cpu ? `${cpuUsage} (${systemData.cpu.cores} cores @ ${systemData.cpu.speed} GHz)` : cpuUsage
      const memoryInfo = systemData.memory
        ? `${systemData.memory.usedGB}/${systemData.memory.totalGB} GB (${systemData.memory.usagePercent}%)`
        : 'N/A'
      const diskInfo = systemData.disk
        ? `${systemData.disk.usedGB}/${systemData.disk.totalGB} GB (${systemData.disk.usagePercent}%)`
        : 'N/A'
      const uptimeInfo = systemData.uptime?.formatted || 'N/A'

      const reply = `System summary:\nCPU: ${cpuInfo}\nMemory: ${memoryInfo}\nDisk: ${diskInfo}\nUptime: ${uptimeInfo}`
      return res.json({ reply })
    }

    if (isWeatherRequest(message)) {
      const city = extractCity(message)
      const weatherResponse = await axios.get(`${BASE_URL}/weather`, {
        params: { city }
      })
      const weatherData = weatherResponse.data

      const current = weatherData.current || {}
      const location = current.city || city
      const temperature = current.temperature != null ? `${current.temperature}°C` : 'N/A'
      const humidity = current.humidity != null ? `${current.humidity}%` : 'N/A'
      const wind = current.wind != null ? `${current.wind} km/h` : 'N/A'
      const condition = current.condition || 'Unknown'

      const reply = `Current weather in ${location}:\nTemperature: ${temperature}\nHumidity: ${humidity}\nWind: ${wind}\nCondition: ${condition}`
      return res.json({ reply })
    }

    if (isNewsRequest(message)) {
      const newsResponse = await axios.get(`${BASE_URL}/news`)
      const newsData = newsResponse.data
      const items = Array.isArray(newsData.news) ? newsData.news.slice(0, 5) : []

      if (!items.length) {
        return res.json({ reply: 'I could not find any news headlines at the moment.' })
      }

      const headlines = items
        .map((item, index) => `${index + 1}. ${item.title} (${item.source || 'Unknown'})`)
        .join('\n')

      const reply = `Top 5 headlines:\n${headlines}`
      return res.json({ reply })
    }

    if (isGithubRequest(message)) {
      const username = extractGithubUsername(message)
      const githubResponse = await axios.get(`${BASE_URL}/github/${encodeURIComponent(username)}`)
      const githubData = githubResponse.data
      const recentRepos = Array.isArray(githubData.repositories) ? githubData.repositories.slice(0, 5) : []

      const repoList = recentRepos
        .map((repo) => `- ${repo.name} (${repo.stars} stars)`) 
        .join('\n')

      const reply = `GitHub summary for ${githubData.username || username}:\nName: ${githubData.username || username}\nRepositories: ${githubData.publicRepos ?? 0}\nFollowers: ${githubData.followers ?? 0}\nRecent repositories:\n${repoList}`
      return res.json({ reply })
    }

    const reply = await generateResponse(message)
    return res.json({ reply })
  } catch (error) {
    console.error('AI chat error:', error?.message || error)
    return res.status(500).json({
      reply: 'Sorry, there was an error processing your AI request.',
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    })
  }
})

export default router
