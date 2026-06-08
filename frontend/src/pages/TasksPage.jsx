import React, { useEffect, useMemo, useState } from 'react'
import '../components/TaskCard.css'
import './TasksPage.css'

const SORT_OPTIONS = [
  { key: 'date-asc', label: 'Due Date (Earliest First)' },
  { key: 'date-desc', label: 'Due Date (Latest First)' },
  { key: 'priority-high', label: 'Priority (High to Low)' },
  { key: 'created', label: 'Recently Created' }
]

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
]

const PRIORITY_ORDER = { high: 1, medium: 2, low: 3 }

const formatDueDate = (dateString) => {
  if (!dateString) return 'No date'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const TasksPage = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-asc')
  const [page, setPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    fetchAllTasks()
  }, [])

  const fetchAllTasks = async () => {
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

      setTasks(data)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((task) => task.title.toLowerCase().includes(query))
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((task) => task.status === statusFilter)
    }

    // Sort
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        break
      case 'date-desc':
        result.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
        break
      case 'priority-high':
        result.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        break
      case 'created':
        result.reverse()
        break
      default:
        break
    }

    return result
  }, [tasks, searchQuery, statusFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTasks.length / pageSize))
  const visibleTasks = filteredAndSortedTasks.slice((page - 1) * pageSize, page * pageSize)

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'task-priority-high'
      case 'medium':
        return 'task-priority-medium'
      default:
        return 'task-priority-low'
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'done':
        return 'task-status-done'
      case 'inprogress':
        return 'task-status-inprogress'
      default:
        return 'task-status-todo'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'todo':
        return 'To Do'
      case 'inprogress':
        return 'In Progress'
      case 'done':
        return 'Done'
      default:
        return status
    }
  }

  return (
    <div className="tasks-page-container">
      <div className="tasks-page-header">
        <div>
          <h1>All Tasks</h1>
          <p className="tasks-page-subtitle">Manage and track all your tasks</p>
        </div>
      </div>

      {loading ? (
        <div className="tasks-loading">Loading tasks…</div>
      ) : error ? (
        <div className="tasks-error">
          <p>Error: {error}</p>
          <button className="tasks-retry-btn" onClick={fetchAllTasks}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="tasks-controls">
            <div className="tasks-search-container">
              <input
                type="text"
                className="tasks-search-input"
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
              />
              <span className="tasks-search-icon">🔍</span>
            </div>

            <div className="tasks-filters">
              <select
                className="tasks-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className="tasks-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="tasks-empty">
              <p>No tasks found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="tasks-table-container">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th className="col-task">Task</th>
                      <th className="col-priority">Priority</th>
                      <th className="col-status">Status</th>
                      <th className="col-due-date">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.map((task) => (
                      <tr key={task.id} className={task.completed ? 'task-row-completed' : ''}>
                        <td className="col-task">
                          <span className="task-checkbox-icon">{task.completed ? '✓' : '○'}</span>
                          <span className={task.completed ? 'task-title-completed' : ''}>{task.title}</span>
                        </td>
                        <td className="col-priority">
                          <span className={`task-priority-badge ${getPriorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="col-status">
                          <span className={`task-status-badge ${getStatusBadgeClass(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        <td className="col-due-date">{formatDueDate(task.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="tasks-pagination">
                <button
                  className="tasks-pagination-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span className="tasks-pagination-info">
                  Page {page} of {totalPages} ({filteredAndSortedTasks.length} tasks)
                </span>
                <button
                  className="tasks-pagination-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default TasksPage
