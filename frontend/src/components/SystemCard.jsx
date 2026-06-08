
import React, { useEffect, useState } from 'react'
import CircularProgress from './CircularProgress'
import './SystemCard.css'

const SystemCard = () => {
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState(null)
	const [systemData, setSystemData] = useState(null)

	useEffect(() => {
		let mounted = true

		const fetchAndSchedule = async () => {
			await fetchSystem()
			if (!mounted) return
		}

		fetchAndSchedule()

		const id = setInterval(() => {
			fetchSystem()
		}, 5000)

		return () => {
			mounted = false
			clearInterval(id)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const fetchSystem = async () => {
		if (systemData) {
			setRefreshing(true)
		} else {
			setLoading(true)
		}
		setError(null)

		try {
			const res = await fetch('http://localhost:5000/system')
			const data = await res.json()

			if (!res.ok) {
				throw new Error(data.error || 'Failed to load system data')
			}

			setSystemData(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch system data')
			console.error('SystemCard fetch error:', err)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	const formatPercent = (v) => (typeof v === 'number' ? `${v}%` : '--')
	const formatMbps = (v) => (typeof v === 'number' ? `${v} Mbps` : '--')

	if (loading && !systemData) {
		return (
			<div className="system-card system-card-loading">
				<h3>System Monitor</h3>
				<div className="skeleton-grid">
					<div className="skeleton-circle" />
					<div className="skeleton-circle" />
					<div className="skeleton-circle" />
				</div>
				<div className="skeleton-row" />
				<div className="skeleton-row short" />
			</div>
		)
	}

	if (error && !systemData) {
		return (
			<div className="system-card system-card-error">
				<h3>System Monitor</h3>
				<p className="error-msg">{error}</p>
				<button onClick={fetchSystem}>Retry</button>
			</div>
		)
	}

	const cpuUsage = systemData?.cpu?.usage
	const ramUsage = systemData?.memory?.usagePercent
	const diskUsage = systemData?.disk?.usagePercent
	const download = systemData?.network?.downloadMbps
	const upload = systemData?.network?.uploadMbps
	const uptime =
		systemData?.uptime?.formatted ??
			(typeof systemData?.uptime?.seconds === 'number' ? `${systemData.uptime.seconds}s` : '--')

	return (
		<div className="system-card">
			<div className="system-card__header">
				<div>
					<h3>System Monitor</h3>
					<p className="system-card__subtitle">Live server telemetry refreshed every 5 seconds</p>
				</div>
				{refreshing && <span className="system-card__pill">Refreshing</span>}
			</div>

			<div className="system-metrics">
				<div className="gauge-wrapper">
					<CircularProgress label="CPU Usage" value={cpuUsage} />
				</div>

				<div className="gauge-wrapper">
					<CircularProgress label="RAM Usage" value={ramUsage} />
				</div>

				<div className="gauge-wrapper">
					<CircularProgress label="Disk Usage" value={diskUsage} />
				</div>
			</div>



			<div className="system-uptime">
				<div>
					<p className="uptime-label">System Uptime</p>
					<p className="uptime-value">{uptime}</p>
				</div>
				<button className="refresh-button" onClick={fetchSystem}>
					Refresh data
				</button>
			</div>
		</div>
	)
}

export default SystemCard
