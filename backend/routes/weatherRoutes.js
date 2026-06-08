import express from 'express'
import axios from 'axios'

const router = express.Router()
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'

const mapConditionToEmoji = (condition = '') => {
  const normalized = condition.toLowerCase()
  if (normalized.includes('cloud')) return '☁️'
  if (normalized.includes('rain')) return '🌧️'
  if (normalized.includes('thunder')) return '⛈️'
  if (normalized.includes('snow')) return '❄️'
  if (normalized.includes('mist') || normalized.includes('fog') || normalized.includes('haze')) return '🌫️'
  if (normalized.includes('clear')) return '☀️'
  return '⛅'
}

const getDayLabel = (timestamp) =>
  new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short'
  })

const buildForecast = (forecastList, excludeDateKey = null) => {
  const daily = {}

  forecastList.forEach((item) => {
    const dateKey = new Date(item.dt * 1000).toISOString().slice(0, 10)
    if (excludeDateKey && dateKey === excludeDateKey) {
      return
    }

    const condition = item.weather?.[0]?.main || 'Clear'
    const icon = item.weather?.[0]?.icon || ''

    if (!daily[dateKey]) {
      daily[dateKey] = {
        high: item.main.temp_max,
        low: item.main.temp_min,
        conditionCounts: { [condition]: 1 },
        iconCounts: { [icon]: 1 },
        day: getDayLabel(item.dt),
        representativeCondition: condition,
        representativeIcon: icon
      }
    } else {
      daily[dateKey].high = Math.max(daily[dateKey].high, item.main.temp_max)
      daily[dateKey].low = Math.min(daily[dateKey].low, item.main.temp_min)
      daily[dateKey].conditionCounts[condition] = (daily[dateKey].conditionCounts[condition] || 0) + 1
      daily[dateKey].iconCounts[icon] = (daily[dateKey].iconCounts[icon] || 0) + 1
    }
  })

  return Object.values(daily)
    .slice(0, 5)
    .map((entry) => {
      const representativeCondition = Object.entries(entry.conditionCounts).reduce(
        (best, [condition, count]) => (count > best.count ? { condition, count } : best),
        { condition: entry.representativeCondition, count: 0 }
      ).condition

      const representativeIcon = Object.entries(entry.iconCounts).reduce(
        (best, [icon, count]) => (count > best.count ? { icon, count } : best),
        { icon: entry.representativeIcon, count: 0 }
      ).icon

      return {
        day: entry.day,
        high: Math.round(entry.high),
        low: Math.round(entry.low),
        condition: representativeCondition,
        icon: representativeIcon
      }
    })
}

router.get('/weather', async (req, res) => {
  try {
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY

    if (!WEATHER_API_KEY) {
      return res.status(500).json({
        error: 'Weather API key is not configured',
        status: 500
      })
    }

    const city = req.query.city || 'Hyderabad'

    const currentResponse = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    })

    const weatherData = currentResponse.data

    console.log('OpenWeather response.data:', weatherData)
    console.log('OpenWeather response.data.main:', weatherData.main)
    console.log('OpenWeather response.data.wind:', weatherData.wind)
    console.log('OpenWeather response.data.weather:', weatherData.weather)

    const currentDayKey = new Date(weatherData.dt * 1000).toISOString().slice(0, 10)

    const forecastResponse = await axios.get(OPENWEATHER_FORECAST_URL, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    })

    if (!forecastResponse?.data?.list || !Array.isArray(forecastResponse.data.list)) {
      throw new Error('Invalid forecast data received from OpenWeather')
    }

    console.log('OpenWeather forecast response.data:', forecastResponse.data)
    let forecast = buildForecast(forecastResponse.data.list, currentDayKey)

    if (!forecast.length) {
      throw new Error('Forecast processing returned no days')
    }

    const cityName = weatherData.name
    const temperature = weatherData.main.temp
    const humidity = weatherData.main.humidity
    const wind = weatherData.wind.speed
    const feelsLike = weatherData.main.feels_like
    const condition = weatherData.weather?.[0]?.main || 'Clear'
    const icon = weatherData.weather?.[0]?.icon || ''

    console.log('Current temperature:', temperature)
    console.log('Forecast daily highs:', forecast.map((day) => day.high))
    console.log('Forecast daily lows:', forecast.map((day) => day.low))
    console.log('Weather Response:', {
      city: cityName,
      temperature,
      humidity,
      wind,
      feelsLike,
      condition
    })

    const payload = {
      current: {
        city: cityName,
        temperature,
        humidity,
        wind,
        feelsLike,
        condition,
        icon
      },
      forecast
    }

    return res.json(payload)
  } catch (error) {
    let status = 500
    let message = 'Unable to fetch weather data'

    if (axios.isAxiosError(error)) {
      if (error.response) {
        status = error.response.status
        message = error.response.data?.message || 'OpenWeather service error'
      } else if (error.request) {
        status = 502
        message = 'No response from OpenWeather API'
      }
    } else if (error instanceof Error) {
      message = error.message
    }

    return res.status(status).json({
      error: message,
      status
    })
  }
})

export default router
