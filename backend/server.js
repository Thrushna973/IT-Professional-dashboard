import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import weatherRoutes from './routes/weatherRoutes.js'
import newsRoutes from './routes/newsRoutes.js'
import githubRoutes from './routes/githubRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import systemRoutes from './routes/systemRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import aiRoutes from './routes/aiRoutes.js'





const envResult = dotenv.config()
console.log('dotenv loaded:', envResult)
console.log('cwd:', process.cwd())
console.log('WEATHER_API_KEY:', process.env.WEATHER_API_KEY)
console.log("GEMINI_API_KEY =", process.env.GEMINI_API_KEY)


const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  })
})

app.use(weatherRoutes)
app.use(newsRoutes)
console.log('✓ Registering GitHub routes...')
app.use(githubRoutes)
console.log('✓ GitHub routes registered')
app.use('/', taskRoutes)
console.log('✓ Task routes registered')
app.use('/', systemRoutes)
console.log('✓ System routes registered')
app.use(eventRoutes)
app.use(aiRoutes)

// Test route
app.get('/test-github', (req, res) => {
  res.json({ message: 'GitHub test route works' })
})

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    status: 404
  })
})

app.use((err, req, res, next) => {
  console.error('Server Error:', err)

  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(status).json({
    error: message,
    status,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})



app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📡 CORS allowed origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
