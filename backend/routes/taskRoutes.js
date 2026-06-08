import express from 'express'
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const TASKS_FILE_PATH = join(__dirname, '../data/tasks.json')

console.log('✅ taskRoutes loaded')

const STATUS_VALUES = ['todo', 'inprogress', 'done']
const PRIORITY_VALUES = ['low', 'medium', 'high']

const readTasksFile = async () => {
  try {
    const raw = await fs.promises.readFile(TASKS_FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.mkdir(join(__dirname, '../data'), { recursive: true })
      await fs.promises.writeFile(TASKS_FILE_PATH, '[]', 'utf-8')
      return []
    }
    throw error
  }
}

const writeTasksFile = async (tasks) => {
  await fs.promises.writeFile(TASKS_FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8')
}

const validateTaskPayload = (payload, isUpdate = false) => {
  const errors = []

  if (!isUpdate || payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string')
    }
  }

  if (!isUpdate || payload.status !== undefined) {
    if (typeof payload.status !== 'string' || !STATUS_VALUES.includes(payload.status)) {
      errors.push(`status must be one of: ${STATUS_VALUES.join(', ')}`)
    }
  }

  if (!isUpdate || payload.priority !== undefined) {
    if (typeof payload.priority !== 'string' || !PRIORITY_VALUES.includes(payload.priority)) {
      errors.push(`priority must be one of: ${PRIORITY_VALUES.join(', ')}`)
    }
  }

  if (!isUpdate || payload.dueDate !== undefined) {
    if (payload.dueDate === undefined || payload.dueDate === null || payload.dueDate === '') {
      errors.push('dueDate is required and must be a valid ISO date string')
    } else if (typeof payload.dueDate !== 'string' || Number.isNaN(Date.parse(payload.dueDate))) {
      errors.push('dueDate must be a valid ISO date string')
    }
  }

  if (!isUpdate || payload.completed !== undefined) {
    if (typeof payload.completed !== 'boolean') {
      errors.push('completed must be a boolean')
    }
  }

  return errors
}

const generateTaskId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

router.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await readTasksFile()
    res.json(tasks)
  } catch (error) {
    next(error)
  }
})

router.get('/tasks/:id', async (req, res, next) => {
  try {
    const tasks = await readTasksFile()
    const task = tasks.find((item) => item.id === req.params.id)

    if (!task) {
      return res.status(404).json({ error: 'Task not found', status: 404 })
    }

    res.json(task)
  } catch (error) {
    next(error)
  }
})

router.post('/tasks', async (req, res, next) => {
  try {
    const payload = req.body
    const validationErrors = validateTaskPayload(payload)

    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors.join('; '), status: 400 })
    }

    const newTask = {
      id: generateTaskId(),
      title: payload.title.trim(),
      status: payload.status,
      priority: payload.priority,
      dueDate: payload.dueDate,
      completed: payload.completed
    }

    const tasks = await readTasksFile()
    tasks.push(newTask)
    await writeTasksFile(tasks)

    res.status(201).json(newTask)
  } catch (error) {
    next(error)
  }
})

router.put('/tasks/:id', async (req, res, next) => {
  try {
    const payload = req.body
    const validationErrors = validateTaskPayload(payload, true)

    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors.join('; '), status: 400 })
    }

    const tasks = await readTasksFile()
    const index = tasks.findIndex((item) => item.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found', status: 404 })
    }

    const existingTask = tasks[index]
    const updatedTask = {
      ...existingTask,
      ...('title' in payload ? { title: payload.title.trim() } : {}),
      ...('status' in payload ? { status: payload.status } : {}),
      ...('priority' in payload ? { priority: payload.priority } : {}),
      ...('dueDate' in payload ? { dueDate: payload.dueDate } : {}),
      ...('completed' in payload ? { completed: payload.completed } : {})
    }

    tasks[index] = updatedTask
    await writeTasksFile(tasks)

    res.json(updatedTask)
  } catch (error) {
    next(error)
  }
})

router.delete('/tasks/:id', async (req, res, next) => {
  try {
    const tasks = await readTasksFile()
    const index = tasks.findIndex((item) => item.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found', status: 404 })
    }

    const [deletedTask] = tasks.splice(index, 1)
    await writeTasksFile(tasks)

    res.json({ message: 'Task deleted', task: deletedTask })
  } catch (error) {
    next(error)
  }
})

export default router
