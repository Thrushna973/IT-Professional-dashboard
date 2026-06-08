import React, { useEffect, useMemo, useState } from 'react'
import './CalendarPage.css'

const EVENT_TYPES = {
  meeting: 'Meeting',
  project: 'Project',
  client: 'Client',
  review: 'Review'
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]
const EVENTS_URL = 'http://localhost:5000/events'

const normalizeDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

const formatDateLabel = (date) => {
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatTimeLabel = (time) => {
  if (!time) return 'TBA'
  const normalized = time.trim()
  if (/^\d{2}:\d{2}$/.test(normalized)) {
    const [hours, minutes] = normalized.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }
  return normalized
}

const formatDateKey = (date) => {
  const normalized = normalizeDate(date)
  return normalized ? normalized.toISOString().slice(0, 10) : ''
}

const buildCalendarDays = (year, month) => {
  const firstOfMonth = new Date(year, month, 1)
  const firstDayIndex = firstOfMonth.getDay()
  const startDate = new Date(firstOfMonth)
  startDate.setDate(firstOfMonth.getDate() - firstDayIndex)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + index)
    day.setHours(0, 0, 0, 0)
    return day
  })
}

const CalendarPage = () => {
  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMonth, setCurrentMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth()
  })
  const [selectedDate, setSelectedDate] = useState(today)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [activeEvent, setActiveEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    date: today.toISOString().slice(0, 10),
    time: '09:00',
    type: 'meeting'
  })

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(EVENTS_URL)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load events')
      }

      if (!Array.isArray(payload)) {
        throw new Error('Unexpected events response format')
      }

      setEvents(
        payload
          .map((event) => ({
            ...event,
            dateKey: formatDateKey(event.date)
          }))
          .sort((a, b) => {
            if (a.dateKey < b.dateKey) return -1
            if (a.dateKey > b.dateKey) return 1
            return (a.time || '').localeCompare(b.time || '')
          })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth.year, currentMonth.month),
    [currentMonth]
  )

  const eventsByDate = useMemo(() => {
    const map = new Map()
    events.forEach((event) => {
      const key = formatDateKey(event.date)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(event)
    })
    return map
  }, [events])

  const selectedDateEvents = useMemo(() => {
    const dayKey = formatDateKey(selectedDate)
    const list = eventsByDate.get(dayKey) || []
    return [...list].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }, [eventsByDate, selectedDate])

  const monthEventCount = useMemo(
    () => events.filter((event) => {
      const date = normalizeDate(event.date)
      return (
        date &&
        date.getFullYear() === currentMonth.year &&
        date.getMonth() === currentMonth.month
      )
    }).length,
    [events, currentMonth]
  )

  const openAddModal = () => {
    setModalMode('add')
    setActiveEvent(null)
    setFormData({
      title: '',
      date: selectedDate.toISOString().slice(0, 10),
      time: '09:00',
      type: 'meeting'
    })
    setModalOpen(true)
  }

  const openEditModal = (event) => {
    setModalMode('edit')
    setActiveEvent(event)
    setFormData({
      title: event.title,
      date: formatDateKey(event.date),
      time: event.time || '09:00',
      type: event.type || 'meeting'
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setActiveEvent(null)
    setFormData({
      title: '',
      date: selectedDate.toISOString().slice(0, 10),
      time: '09:00',
      type: 'meeting'
    })
  }

  const changeMonth = (offset) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev.year, prev.month + offset, 1)
      return {
        year: next.getFullYear(),
        month: next.getMonth()
      }
    })
  }

  const handleDaySelect = (day) => {
    setSelectedDate(day)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Event title is required.')
      return
    }

    if (!formData.date) {
      setError('Event date is required.')
      return
    }

    if (!formData.time.trim()) {
      setError('Event time is required.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const method = modalMode === 'edit' && activeEvent ? 'PUT' : 'POST'
      const url = modalMode === 'edit' && activeEvent ? `${EVENTS_URL}/${activeEvent.id}` : EVENTS_URL
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          date: formData.date,
          time: formData.time.trim(),
          type: formData.type
        })
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save event.')
      }

      await fetchEvents()
      closeModal()
      const selected = normalizeDate(formData.date)
      if (selected) {
        setSelectedDate(selected)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (eventToDelete) => {
    if (!window.confirm('Delete this event?')) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`${EVENTS_URL}/${eventToDelete.id}`, {
        method: 'DELETE'
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete event.')
      }

      await fetchEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete event.')
    } finally {
      setIsSaving(false)
    }
  }

  const monthLabel = `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}`
  const selectedDayLabel = formatDateLabel(selectedDate)

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="calendar-subtitle">Calendar</p>
          <h1 className="calendar-title">Monthly schedule and event management</h1>
        </div>
      </header>

      <section className="calendar-grid">
        <div className="calendar-panel">
          <div className="calendar-toolbar">
            <button type="button" className="calendar-nav-button" onClick={() => changeMonth(-1)}>
              Prev
            </button>
            <div className="calendar-month-label">{monthLabel}</div>
            <button type="button" className="calendar-nav-button" onClick={() => changeMonth(1)}>
              Next
            </button>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAYS.map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {calendarDays.map((day) => {
              const dayKey = formatDateKey(day)
              const isCurrentMonth = day.getMonth() === currentMonth.month
              const isSelected = formatDateKey(day) === formatDateKey(selectedDate)
              const dayEvents = eventsByDate.get(dayKey) || []

              return (
                <button
                  type="button"
                  key={`${dayKey}-${day.getDate()}`}
                  className={`calendar-day ${isCurrentMonth ? '' : 'calendar-day--muted'} ${
                    isSelected ? 'calendar-day--selected' : ''
                  }`}
                  onClick={() => handleDaySelect(day)}
                >
                  <span className="calendar-day-number">{day.getDate()}</span>
                  {dayEvents.length > 0 && <span className="calendar-day-badge">{dayEvents.length}</span>}
                </button>
              )
            })}
          </div>

          <div className="calendar-summary">
            <span>{monthEventCount} event{monthEventCount === 1 ? '' : 's'} this month</span>
            <span>{selectedDayLabel}</span>
          </div>
        </div>

        <div className="events-panel">
          <div className="events-panel-header">
            <div>
              <p className="events-panel-label">Events</p>
              <h2>Events on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
            </div>
            <button type="button" className="events-add-button" onClick={openAddModal}>
              + Add Event
            </button>
          </div>

          {loading ? (
            <div className="events-status">Loading events...</div>
          ) : error ? (
            <div className="events-status events-status--error">{error}</div>
          ) : selectedDateEvents.length === 0 ? (
            <div className="events-empty">No events for this day. Add one to get started.</div>
          ) : (
            <ul className="events-list">
              {selectedDateEvents.map((event) => (
                <li key={event.id} className="events-list-item">
                  <div className="events-item-header">
                    <span className={`events-item-tag events-item-tag--${event.type || 'meeting'}`}>
                      {EVENT_TYPES[event.type] || 'Meeting'}
                    </span>
                    <span className="events-item-time">{formatTimeLabel(event.time)}</span>
                  </div>
                  <p className="events-item-title">{event.title}</p>
                  <div className="events-item-actions">
                    <button type="button" className="events-action-button" onClick={() => openEditModal(event)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="events-action-button events-action-button--danger"
                      onClick={() => handleDelete(event)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {modalOpen && (
        <div className="calendar-modal-overlay" onClick={closeModal}>
          <div className="calendar-modal" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-modal-header">
              <div>
                <p className="calendar-modal-label">{modalMode === 'edit' ? 'Edit Event' : 'Add Event'}</p>
                <h2>{modalMode === 'edit' ? 'Update event details' : 'Create a new event'}</h2>
              </div>
              <button type="button" className="calendar-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="calendar-modal-body">
              <label className="calendar-field">
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Event title"
                />
              </label>

              <label className="calendar-field">
                <span>Date</span>
                <input type="date" name="date" value={formData.date} onChange={handleFormChange} />
              </label>

              <label className="calendar-field">
                <span>Time</span>
                <input type="time" name="time" value={formData.time} onChange={handleFormChange} />
              </label>

              <label className="calendar-field">
                <span>Type</span>
                <select name="type" value={formData.type} onChange={handleFormChange}>
                  {Object.entries(EVENT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {error && <div className="calendar-modal-error">{error}</div>}
            </div>

            <footer className="calendar-modal-footer">
              <button type="button" className="calendar-modal-cancel" onClick={closeModal} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="calendar-modal-save" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Create Event'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  )
}

export default CalendarPage
