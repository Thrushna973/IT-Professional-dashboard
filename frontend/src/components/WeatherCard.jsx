import React, { useEffect, useState } from 'react'
import './WeatherCard.css'

const WeatherCard = () => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  console.log('Weather Data:', weather)

  useEffect(() => {
    fetchWeather()
  }, [])

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:5000/weather?city=Hyderabad')
      const data = await response.json()
      console.log('Weather response payload:', data)
      console.log('Weather response payload.current:', data.current)
      console.log('Weather response payload.forecast:', data.forecast)
      console.log('Weather response payload.current.wind:', data.current?.wind)
      console.log('Weather response payload.current.feelsLike:', data.current?.feelsLike)

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load weather')
      }

      const current = data.current
      const forecast = data.forecast

      if (!current || typeof current !== 'object') {
        throw new Error('Invalid current weather payload')
      }

      if (!Array.isArray(forecast) || forecast.length === 0) {
        throw new Error('Invalid forecast payload')
      }

      if (typeof current.city !== 'string') {
        throw new Error('Missing city in current weather payload')
      }

      if (typeof current.temperature !== 'number') {
        throw new Error('Missing temperature in current weather payload')
      }

      if (typeof current.humidity !== 'number') {
        throw new Error('Missing humidity in current weather payload')
      }

      if (typeof current.wind !== 'number') {
        throw new Error('Missing wind in current weather payload')
      }

      if (typeof current.feelsLike !== 'number') {
        throw new Error('Missing feelsLike in current weather payload')
      }

      if (typeof current.condition !== 'string') {
        throw new Error('Missing condition in current weather payload')
      }

      if (typeof current.icon !== 'string') {
        throw new Error('Missing icon in current weather payload')
      }

      setWeather({
        current,
        forecast
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const current = weather?.current || {}

  const formatNumber = (value) => (typeof value === 'number' ? Math.round(value) : '--')
  const formatFeelsLike = (value) => (typeof value === 'number' ? `${Math.round(value)}°C` : '--')
  const formatWind = (value) => (typeof value === 'number' ? `${Math.round(value * 3.6)} km/h` : '--')
  const formatHumidity = (value) => (typeof value === 'number' ? `${value}%` : '--')

  const mapOpenWeatherIcon = (iconCode = '') => {
    if (iconCode.startsWith('01')) return '☀️'
    if (iconCode.startsWith('02')) return '⛅'
    if (iconCode.startsWith('03') || iconCode.startsWith('04')) return '☁️'
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return '🌧️'
    if (iconCode.startsWith('11')) return '⛈️'
    if (iconCode.startsWith('13')) return '❄️'
    if (iconCode.startsWith('50')) return '🌫️'
    return '⛅'
  }

  if (loading) {
    return (
      <div className="weather-card weather-card-loading">
        <div className="loading-shell top-shell" />
        <div className="loading-shell icon-shell" />
        <div className="loading-shell info-shell" />
        <div className="loading-shell forecast-shell" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="weather-card weather-card-error">
        <div className="error-state-card">
          <p className="error-icon">⚠️</p>
          <h3>Weather update failed</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchWeather}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="weather-card weather-card-premium">
      <div className="weather-top">
        <div className="weather-left">
          <div className="weather-symbol">{mapOpenWeatherIcon(current.icon)}</div>
          <div className="weather-meta">
            <p className="weather-city">{current.city}</p>
            <p className="weather-condition">{current.condition}</p>
          </div>
        </div>

        <div className="weather-right">
          <p className="weather-temp-large">{formatNumber(current.temperature)}°C</p>
        </div>
      </div>

      <div className="weather-info-section">
        <div className="weather-info-card">
          <div className="info-icon">💧</div>
          <div className="info-copy">
            <p className="info-label">Humidity</p>
            <p className="info-value">{formatHumidity(current.humidity)}</p>
          </div>
        </div>

        <div className="weather-info-card">
          <div className="info-icon">💨</div>
          <div className="info-copy">
            <p className="info-label">Wind</p>
            <p className="info-value">{formatWind(current.wind)}</p>
          </div>
        </div>

        <div className="weather-info-card">
          <div className="info-icon">🌡️</div>
          <div className="info-copy">
            <p className="info-label">Feels Like</p>
            <p className="info-value">{formatFeelsLike(current.feelsLike)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherCard
