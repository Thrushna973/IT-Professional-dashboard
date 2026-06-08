import express from 'express'
import si from 'systeminformation'

const router = express.Router()

console.log('✓ systemRoutes loaded')

// Helper function to convert bytes to GB
const bytesToGB = (bytes) => {
  return Math.round((bytes / (1024 ** 3)) * 10) / 10
}

// Helper function to format uptime
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.length > 0 ? parts.join(' ') : '0m'
}

// GET /system - Get system information
router.get('/system', async (req, res) => {
  try {
    // Fetch system information in parallel
    
    const [cpuInfo, memInfo, diskInfo, networkStats, timeInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.time()
    ])
    console.log('Network Stats:', networkStats)
    // Process CPU data
    const cpu = {
      usage: Math.round(await si.currentLoad().then((data) => data.currentLoad) * 10) / 10,
      speed: cpuInfo.speed || 0,
      cores: cpuInfo.cores || 0
    }

    // Process Memory data
    const memory = {
      usedGB: bytesToGB(memInfo.used),
      totalGB: bytesToGB(memInfo.total),
      usagePercent: Math.round((memInfo.used / memInfo.total) * 1000) / 10
    }

    // Process Disk data (get total across all drives)
    let totalDiskUsed = 0
    let totalDiskSize = 0

    diskInfo.forEach((disk) => {
      totalDiskUsed += disk.used
      totalDiskSize += disk.size
    })

    const disk = {
      usedGB: bytesToGB(totalDiskUsed),
      totalGB: bytesToGB(totalDiskSize),
      usagePercent: totalDiskSize > 0 ? Math.round((totalDiskUsed / totalDiskSize) * 1000) / 10 : 0
    }

    // Process Network data (calculate average speeds)
    let totalDownload = 0
    let totalUpload = 0

    networkStats.forEach((net) => {
      totalDownload += net.rx_sec || 0
      totalUpload += net.tx_sec || 0
    })

    // Convert bytes/sec to Mbps
    const network = {
      downloadMbps: Math.round((totalDownload / (1024 ** 2)) * 10) / 10,
      uploadMbps: Math.round((totalUpload / (1024 ** 2)) * 10) / 10
    }

    // Process Uptime data
    const uptimeSeconds = typeof timeInfo?.uptime === 'number' ? Math.floor(timeInfo.uptime) : 0
    const uptime = {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    }

    console.log('system uptime seconds:', uptime.seconds, 'formatted:', uptime.formatted)

    res.json({
      cpu,
      memory,
      disk,
      network,
      uptime
    })
  } catch (err) {
    console.error('Error fetching system information:', err)
    res.status(500).json({
      error: 'Failed to fetch system information',
      message: err instanceof Error ? err.message : 'Unknown error occurred'
    })
  }
})

export default router
