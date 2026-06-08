import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TAB_DEFINITIONS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
]

const PRIORITY_OPTIONS = ['low', 'medium', 'high']
const STATUS_OPTIONS = ['todo', 'inprogress', 'done']
const STORAGE_KEY = 'dashboard_tasks'

const formatDueDate = (value) => {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const mapPriorityClass = (priority) => {
  switch (priority) {
    case 'high':
      return 'task-priority-high'
    case 'medium':
      return 'task-priority-medium'
    default:
      return 'task-priority-low'
  }
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

const isUpcoming = (dueDate) => {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  return due >= today && due <= sevenDaysFromNow
}

const TaskCard = () => {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    status: 'todo',
    dueDate: ''
  })
  const [formError, setFormError] = useState(null)

  // Sync tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    let isMounted = true

    const fetchTasks = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('http://localhost:5000/tasks')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load tasks')
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid task response format')
        }

        if (isMounted) {
          setTasks(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTasks()

    return () => {
      isMounted = false
    }
  }, [])

  const counts = useMemo(() => {
    const result = {
      all: tasks.length,
      todo: 0,
      inprogress: 0,
      done: 0,
      completed: 0,
      overdue: 0,
      upcoming: 0
    }

    tasks.forEach((task) => {
      if (task.status === 'todo') result.todo += 1
      if (task.status === 'inprogress') result.inprogress += 1
      if (task.status === 'done') result.done += 1
      if (task.completed) result.completed += 1
      if (isOverdue(task.dueDate) && task.status !== 'done') result.overdue += 1
      if (isUpcoming(task.dueDate) && task.status !== 'done') result.upcoming += 1
    })

    return result
  }, [tasks])

  const completionPercentage = useMemo(() => {
    if (counts.all === 0) return 0
    return Math.round((counts.done / counts.all) * 100)
  }, [counts])

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((task) => isUpcoming(task.dueDate) && task.status !== 'done')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks
    return tasks.filter((task) => task.status === activeTab)
  }, [tasks, activeTab])

  const handleAddTaskClick = () => {
    setShowModal(true)
    setFormError(null)
    setFormData({
      title: '',
      priority: 'medium',
      status: 'todo',
      dueDate: ''
    })
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    setFormError(null)
  }

  const handleCancel = () => {
    setShowModal(false)
    setFormError(null)
    setFormData({
      title: '',
      priority: 'medium',
      status: 'todo',
      dueDate: ''
    })
  }

  const handleSave = async () => {
    setFormError(null)

    // Validation
    if (!formData.title.trim()) {
      setFormError('Task title is required')
      return
    }

    if (!formData.dueDate) {
      setFormError('Due date is required')
      return
    }

    setIsSaving(true)

    // Create optimistic task object
    const optimisticTask = {
      id: `temp-${Date.now()}`,
      title: formData.title.trim(),
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate,
      completed: formData.status === 'done'
    }

    // Optimistic update - update UI immediately
    setTasks((prev) => [...prev, optimisticTask])
    setShowModal(false)
    setFormData({
      title: '',
      priority: 'medium',
      status: 'todo',
      dueDate: ''
    })

    try {
      const response = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: optimisticTask.title,
          priority: optimisticTask.priority,
          status: optimisticTask.status,
          dueDate: optimisticTask.dueDate,
          completed: optimisticTask.completed
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task')
      }

      // Replace optimistic task with real task from API
      setTasks((prev) =>
        prev.map((task) => (task.id === optimisticTask.id ? data : task))
      )
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save task')
      // Revert optimistic update on error
      setTasks((prev) => prev.filter((task) => task.id !== optimisticTask.id))
      setShowModal(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTaskCompleted = async (taskId, currentTask) => {
    // Optimistic update - update UI immediately
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'done',
              completed: true
            }
          : task
      )
    )

    try {
      const response = await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'done',
          completed: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task')
      }

      // Sync with server response
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? data : task))
      )
    } catch (err) {
      // Revert optimistic update on error
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: currentTask.status,
                completed: currentTask.completed
              }
            : task
        )
      )
      console.error('Error completing task:', err)
    }
  }

  return (
    <div className="task-card">
      <div className="task-card-header">
        <div>
          <h2>Tasks</h2>
          <p className="task-card-subtitle">Manage your team work in one place</p>
        </div>
        <div className="task-card-header-buttons">
          <button className="task-card-view-all-button" type="button" onClick={() => navigate('/tasks')}>
            View All
          </button>
          <button className="task-card-add-button" type="button" onClick={handleAddTaskClick}>
            Add Task
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="task-card-stats">
        <div className="task-card-stat-item">
          <span className="task-card-stat-label">Total Tasks</span>
          <span className="task-card-stat-value">{counts.all}</span>
        </div>
        <div className="task-card-stat-item">
          <span className="task-card-stat-label">Completed</span>
          <span className="task-card-stat-value">{counts.done}</span>
        </div>
        <div className="task-card-stat-item">
          <span className="task-card-stat-label">In Progress</span>
          <span className="task-card-stat-value">{counts.inprogress}</span>
        </div>
        {counts.overdue > 0 && (
          <div className="task-card-stat-item task-card-stat-overdue">
            <span className="task-card-stat-label">Overdue</span>
            <span className="task-card-stat-value">{counts.overdue}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="task-card-progress-container">
        <div className="task-card-progress-header">
          <span>Progress</span>
          <span className="task-card-progress-percentage">{completionPercentage}%</span>
        </div>
        <div className="task-card-progress-bar">
          <div
            className="task-card-progress-fill"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingTasks.length > 0 && (
        <div className="task-card-upcoming">
          <div className="task-card-upcoming-header">
            <span>📅 Upcoming Deadlines</span>
            <span className="task-card-upcoming-count">{upcomingTasks.length}</span>
          </div>
          <div className="task-card-upcoming-list">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="task-card-upcoming-item">
                <div className="task-card-upcoming-title">{task.title}</div>
                <div className="task-card-upcoming-date">{formatDueDate(task.dueDate)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="task-card-tabs">
        {TAB_DEFINITIONS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`task-card-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({counts[tab.key] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="task-card-loading">Loading tasks...</div>
      ) : error ? (
        <div className="task-card-error">Error: {error}</div>
      ) : (
        <div className="task-card-list">
          {filteredTasks.length === 0 ? (
            <div className="task-card-empty">No tasks available for this filter.</div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card-item ${task.completed ? 'task-completed' : ''} ${isOverdue(task.dueDate) && task.status !== 'done' ? 'task-overdue' : ''}`}
              >
                <label className="task-card-item-row">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleTaskCompleted(task.id, task)}
                  />
                  <span className="task-card-title">{task.title}</span>
                </label>
                <div className="task-card-meta">
                  {isOverdue(task.dueDate) && task.status !== 'done' && (
                    <span className="task-overdue-badge">Overdue</span>
                  )}
                  <span
                    className={`task-priority-badge ${task.status === 'done' ? 'task-priority-done' : mapPriorityClass(task.priority)}`}
                  >
                    {task.status === 'done' ? 'Done' : task.priority}
                  </span>
                  <span className="task-card-due-date">Due {formatDueDate(task.dueDate)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="task-modal-overlay" onClick={handleCancel}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3>Add New Task</h3>
              <button className="task-modal-close" type="button" onClick={handleCancel}>
                ✕
              </button>
            </div>

            <div className="task-modal-body">
              {formError && <div className="task-modal-error">{formError}</div>}

              <div className="task-form-group">
                <label htmlFor="task-title" className="task-form-label">
                  Task Title *
                </label>
                <input
                  id="task-title"
                  type="text"
                  name="title"
                  className="task-form-input"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={handleFormChange}
                  disabled={isSaving}
                />
              </div>

              <div className="task-form-group">
                <label htmlFor="task-priority" className="task-form-label">
                  Priority
                </label>
                <select
                  id="task-priority"
                  name="priority"
                  className="task-form-input"
                  value={formData.priority}
                  onChange={handleFormChange}
                  disabled={isSaving}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="task-form-group">
                <label htmlFor="task-status" className="task-form-label">
                  Status
                </label>
                <select
                  id="task-status"
                  name="status"
                  className="task-form-input"
                  value={formData.status}
                  onChange={handleFormChange}
                  disabled={isSaving}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === 'todo' ? 'To Do' : status === 'inprogress' ? 'In Progress' : 'Done'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="task-form-group">
                <label htmlFor="task-due-date" className="task-form-label">
                  Due Date *
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  name="dueDate"
                  className="task-form-input"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="task-modal-footer">
              <button className="task-modal-cancel-btn" type="button" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </button>
              <button className="task-modal-save-btn" type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskCard
