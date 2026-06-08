import React, { useEffect, useId, useState } from 'react'

const CircularProgress = ({ label = '', value }) => {
  const id = useId()
  const gradientId = `cpGradient-${id}`
  const [animated, setAnimated] = useState(0)

  const clamped = typeof value === 'number' && !Number.isNaN(value) ? Math.max(0, Math.min(100, value)) : null

  useEffect(() => {
    if (clamped === null) return

    let animationFrame = null
    const initial = animated
    const target = clamped
    const duration = 700
    let startTime = null

    const animateValue = (timestamp) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const current = Math.round(initial + (target - initial) * progress)
      setAnimated(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateValue)
      }
    }

    animationFrame = requestAnimationFrame(animateValue)
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped])

  const size = 140
  const stroke = 12
  const radius = (size - stroke) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  const progressOffset = clamped === null ? circumference : circumference * (1 - animated / 100)

  return (
    <div className="circular-progress">
      <svg className="circular-progress__svg" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        <circle
          className="circular-progress__track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
        />

        <circle
          className="circular-progress__indicator"
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />

        <text className="circular-progress__percentage" x="50%" y="50%" dominantBaseline="central" textAnchor="middle">
          {clamped === null ? '--' : `${animated}%`}
        </text>
      </svg>

      {label && <div className="circular-progress__label">{label}</div>}
    </div>
  )
}

export default CircularProgress
