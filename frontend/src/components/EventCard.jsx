import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './EventCard.css'

const EVENTS_URL = 'http://localhost:5000/events'
const EVENT_TYPES = ['meeting', 'project', 'client', 'review']

const formatFriendlyDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatDayName = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    weekday: 'long'
  })
}

const formatTimeLabel = (time) => {
  if (!time) return 'Unknown'
  const trimmed = time.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }
  return trimmed
}

const normalizeDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

const createDateKey = (date) => {
  const normalized = normalizeDate(date)
  return normalized ? normalized.toISOString().slice(0, 10) : ''
}

const EventCard = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'meeting'
  })

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(EVENTS_URL)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load events')
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid events response format')
      }

      setEvents(
        data
          .map((event) => ({
            ...event,
            dateKey: createDateKey(event.date),
            timeLabel: formatTimeLabel(event.time)
          }))
          .sort((a, b) => {
            if (a.dateKey < b.dateKey) return -1
            if (a.dateKey > b.dateKey) return 1
            return a.time.localeCompare(b.time)
          })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const visibleEvents = useMemo(() => {
    const key = createDateKey(selectedDate)
    return events.filter((event) => event.dateKey === key)
  }, [events, selectedDate])

  const selectedDateLabel = formatFriendlyDate(selectedDate)
  const selectedDayLabel = formatDayName(selectedDate)

  const handleNav = (offset) => {
    setSelectedDate((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() + offset)
      next.setHours(0, 0, 0, 0)
      return next
    })
  }

  const openModal = () => {
    setFormError('')
    setFormData({
      title: '',
      time: '',
      date: new Date().toISOString().slice(0, 10),
      type: 'meeting'
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormError('')
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleCreateEvent = async () => {
    if (!formData.title.trim()) {
      setFormError('Title is required')
      return
    }

    if (!formData.date) {
      setFormError('Date is required')
      return
    }

    if (!formData.time.trim()) {
      setFormError('Time is required')
      return
    }

    if (!formData.type.trim()) {
      setFormError('Type is required')
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      const response = await fetch(EVENTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          date: formData.date,
          time: formData.time.trim(),
          type: formData.type.trim()
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      await fetchEvents()
      closeModal()

      const eventDate = normalizeDate(formData.date)
      if (eventDate) {
        setSelectedDate(eventDate)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="event-card-widget" onClick={() => navigate('/calendar')}>
      <div className="event-card-grid">
        <section className="event-card-left-panel">
          <div className="event-card-date-block">
            <span className="event-card-date-label">Current Date</span>
            <strong className="event-card-date-value">{selectedDateLabel}</strong>
            <span className="event-card-day-value">{selectedDayLabel}</span>
          </div>
          <div className="event-card-navigation">
            <button type="button" className="event-card-nav-button" onClick={(event) => { event.stopPropagation(); handleNav(-1) }}>
              Previous Day
            </button>
            <button type="button" className="event-card-nav-button" onClick={(event) => { event.stopPropagation(); setSelectedDate(() => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return today
            }) }}>
              Today
            </button>
            <button type="button" className="event-card-nav-button" onClick={(event) => { event.stopPropagation(); handleNav(1) }}>
              Next Day
            </button>
          </div>
        </section>

        <section className="event-card-center-panel">
          <div className="event-card-center-header">
            <h3>Event Timeline</h3>
            <span className="event-card-center-subtitle">{visibleEvents.length} event{visibleEvents.length === 1 ? '' : 's'} for this day</span>
          </div>
          <div className="event-timeline-shell">
            {loading ? (
              <div className="event-status-text">Loading events...</div>
            ) : error ? (
              <div className="event-status-text event-status-error">{error}</div>
            ) : visibleEvents.length === 0 ? (
              <div className="event-status-text">No events scheduled for this day.</div>
            ) : (
              <div className="event-timeline-row">
                {visibleEvents.map((event) => (
                  <article
                    key={event.id}
                    className={`event-block event-type-${event.type || 'meeting'}`}
                  >
                    <strong className="event-block-time">{event.timeLabel}</strong>
                    <p className="event-block-title">{event.title}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="event-card-right-panel">
          <div className="event-add-panel">
            <h3>Manage Events</h3>
            <p>Schedule a new meeting, review, or client session and keep your dashboard synced.</p>
            <button type="button" className="event-add-button" onClick={(event) => { event.stopPropagation(); openModal() }}>
              + Add Event
            </button>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <div className="event-modal-overlay" onClick={(event) => { event.stopPropagation(); closeModal() }}>
          <div className="event-modal" onClick={(event) => event.stopPropagation()}>
            <div className="event-modal-header">
              <div>
                <p className="event-modal-label">New Event</p>
                <h2 className="event-modal-title">Add event to your timeline</h2>
              </div>
              <button className="event-modal-close" type="button" onClick={closeModal} aria-label="Close modal">
                ×
              </button>
            </div>

            <div className="event-modal-body">
              <label className="event-modal-field">
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Event name"
                />
              </label>

              <label className="event-modal-field">
                <span>Date</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                />
              </label>

              <label className="event-modal-field">
                <span>Time</span>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleFormChange}
                />
              </label>

              <label className="event-modal-field">
                <span>Type</span>
                <select name="type" value={formData.type} onChange={handleFormChange}>
                  {EVENT_TYPES.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              {formError && <div className="event-modal-error">{formError}</div>}
            </div>

            <footer className="event-modal-footer">
              <button type="button" className="event-modal-cancel" onClick={closeModal} disabled={isSaving}>
                Cancel
              </button>
              <button
                type="button"
                className="event-modal-submit"
                onClick={handleCreateEvent}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Create Event'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventCard
