import express from 'express'
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const EVENTS_FILE_PATH = join(__dirname, '../data/events.json')

console.log('✅ eventRoutes loaded')

const readEventsFile = async () => {
  try {
    const raw = await fs.promises.readFile(EVENTS_FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.mkdir(join(__dirname, '../data'), { recursive: true })
      await fs.promises.writeFile(EVENTS_FILE_PATH, '[]', 'utf-8')
      return []
    }
    throw error
  }
}

const writeEventsFile = async (events) => {
  await fs.promises.writeFile(EVENTS_FILE_PATH, JSON.stringify(events, null, 2), 'utf-8')
}

const validateEventPayload = (payload, isUpdate = false) => {
  const errors = []

  if (!isUpdate || payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string')
    }
  }

  if (!isUpdate || payload.date !== undefined) {
    if (typeof payload.date !== 'string' || payload.date.trim().length === 0) {
      errors.push('date is required and must be a valid ISO date string')
    } else if (Number.isNaN(Date.parse(payload.date))) {
      errors.push('date must be a valid ISO date string')
    }
  }

  if (!isUpdate || payload.time !== undefined) {
    if (typeof payload.time !== 'string' || payload.time.trim().length === 0) {
      errors.push('time is required and must be a non-empty string')
    }
  }

  if (!isUpdate || payload.type !== undefined) {
    if (typeof payload.type !== 'string' || payload.type.trim().length === 0) {
      errors.push('type is required and must be a non-empty string')
    }
  }

  return errors
}

const generateEventId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

router.get('/events', async (req, res, next) => {
  try {
    const events = await readEventsFile()
    res.json(events)
  } catch (error) {
    next(error)
  }
})

router.get('/events/:id', async (req, res, next) => {
  try {
    const events = await readEventsFile()
    const event = events.find((item) => item.id === req.params.id)

    if (!event) {
      return res.status(404).json({ error: 'Event not found', status: 404 })
    }

    res.json(event)
  } catch (error) {
    next(error)
  }
})

router.post('/events', async (req, res, next) => {
  try {
    const payload = req.body
    const validationErrors = validateEventPayload(payload)

    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors.join('; '), status: 400 })
    }

    const newEvent = {
      id: generateEventId(),
      title: payload.title.trim(),
      date: payload.date,
      time: payload.time.trim(),
      type: payload.type.trim()
    }

    const events = await readEventsFile()
    events.push(newEvent)
    await writeEventsFile(events)

    res.status(201).json(newEvent)
  } catch (error) {
    next(error)
  }
})

router.put('/events/:id', async (req, res, next) => {
  try {
    const payload = req.body
    const validationErrors = validateEventPayload(payload, true)

    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors.join('; '), status: 400 })
    }

    const events = await readEventsFile()
    const index = events.findIndex((item) => item.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Event not found', status: 404 })
    }

    const existingEvent = events[index]
    const updatedEvent = {
      ...existingEvent,
      ...('title' in payload ? { title: payload.title.trim() } : {}),
      ...('date' in payload ? { date: payload.date } : {}),
      ...('time' in payload ? { time: payload.time.trim() } : {}),
      ...('type' in payload ? { type: payload.type.trim() } : {})
    }

    events[index] = updatedEvent
    await writeEventsFile(events)

    res.json(updatedEvent)
  } catch (error) {
    next(error)
  }
})

router.delete('/events/:id', async (req, res, next) => {
  try {
    const events = await readEventsFile()
    const index = events.findIndex((item) => item.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Event not found', status: 404 })
    }

    const [deletedEvent] = events.splice(index, 1)
    await writeEventsFile(events)

    res.json({ message: 'Event deleted', event: deletedEvent })
  } catch (error) {
    next(error)
  }
})

export default router
