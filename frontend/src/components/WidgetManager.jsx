import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import WidgetModal from './WidgetModal.jsx'
import WeatherCard from './WeatherCard.jsx'
import NewsCard from './NewsCard.jsx'
import GithubCard from './GithubCard.jsx'
import TaskCard from './TaskCard.jsx'
import SystemCard from './SystemCard.jsx'
import EventCard from './EventCard.jsx'

const STORAGE_KEY = 'dashboard_widget_visibility'

const WidgetManagerContext = createContext(null)

export const EventsCard = EventCard

const widgetDefinitions = [
  {
    id: 'weather',
    label: 'Weather',
    component: WeatherCard,
    gridClass: 'card-weather',
  },
  {
    id: 'news',
    label: 'Tech News',
    component: NewsCard,
    gridClass: 'card-news',
  },
  {
    id: 'github',
    label: 'GitHub',
    component: GithubCard,
    gridClass: 'card-github',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    component: TaskCard,
    gridClass: 'card-task',
  },
  {
    id: 'system',
    label: 'System Monitor',
    component: SystemCard,
    gridClass: 'card-system',
  },
  {
    id: 'events',
    label: 'Events',
    component: EventCard,
    gridClass: 'card-events',
  },
]

export const WidgetManagerProvider = ({ children }) => {
  const [visibleWidgetIds, setVisibleWidgetIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : widgetDefinitions.map((widget) => widget.id)
    } catch {
      return widgetDefinitions.map((widget) => widget.id)
    }
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSnapshot, setModalSnapshot] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleWidgetIds))
    } catch {
      // ignore localStorage write failures
    }
  }, [visibleWidgetIds])

  const toggleWidgetVisibility = (widgetId) => {
    setVisibleWidgetIds((prev) =>
      prev.includes(widgetId) ? prev.filter((id) => id !== widgetId) : [...prev, widgetId]
    )
  }

  const openWidgetModal = () => {
    setModalSnapshot(visibleWidgetIds)
    setIsModalOpen(true)
  }

  const cancelWidgetModal = () => {
    if (modalSnapshot) {
      setVisibleWidgetIds(modalSnapshot)
    }
    setModalSnapshot(null)
    setIsModalOpen(false)
  }

  const saveWidgetModal = () => {
    setModalSnapshot(null)
    setIsModalOpen(false)
  }

  const availableWidgets = useMemo(
    () =>
      widgetDefinitions.map((widget) => ({
        ...widget,
        selected: visibleWidgetIds.includes(widget.id),
      })),
    [visibleWidgetIds]
  )

  return (
    <WidgetManagerContext.Provider
      value={{
        visibleWidgetIds,
        availableWidgets,
        toggleWidgetVisibility,
        openWidgetModal,
        cancelWidgetModal,
        isModalOpen,
      }}
    >
      {children}
      <WidgetModal
        isOpen={isModalOpen}
        availableWidgets={availableWidgets}
        onToggleWidget={toggleWidgetVisibility}
        onCancel={cancelWidgetModal}
        onSave={saveWidgetModal}
      />
    </WidgetManagerContext.Provider>
  )
}

export const useWidgetManager = () => {
  const context = useContext(WidgetManagerContext)
  if (!context) {
    throw new Error('useWidgetManager must be used inside WidgetManagerProvider')
  }
  return context
}

export const dashboardWidgetOptions = widgetDefinitions
