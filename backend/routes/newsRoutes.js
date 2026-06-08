import express from 'express'
import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'

const router = express.Router()

// RSS feeds to fetch
const FEEDS = [
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica' }
]

// Utility: extract first image URL from HTML string
const extractImageFromHtml = (html = '') => {
  try {
    const m = /<img[^>]+src=["']?([^"'>]+)["']?/i.exec(html)
    if (m && m[1]) return m[1]
  } catch (e) {
    // ignore
  }
  return null
}

// Utility: strip HTML tags for description preview
const stripHtml = (html = '') => {
  return String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

router.get('/news', async (req, res) => {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

    const fetches = FEEDS.map((f) =>
      axios
        .get(f.url, { responseType: 'text', timeout: 10000 })
        .then((r) => ({ feed: f, xml: r.data }))
        .catch((err) => {
          console.warn('Failed to fetch feed', f.url, err.message)
          return null
        })
    )

    const results = await Promise.all(fetches)

    const articles = []

    for (const resItem of results) {
      if (!resItem) continue
      const { feed, xml } = resItem

      let parsed
      try {
        parsed = parser.parse(xml)
      } catch (e) {
        console.warn('Failed to parse XML from', feed.url, e.message)
        continue
      }

      // Typical RSS: rss.channel.item[]
      let items = []

      if (parsed.rss && parsed.rss.channel) {
        const channel = parsed.rss.channel
        if (Array.isArray(channel.item)) items = channel.item
        else if (channel.item) items = [channel.item]
      } else if (parsed.feed && parsed.feed.entry) {
        // Atom feeds: feed.entry[]
        if (Array.isArray(parsed.feed.entry)) items = parsed.feed.entry
        else items = [parsed.feed.entry]
      }

      for (const it of items) {
        // title
        const title = it.title && (typeof it.title === 'object' ? it.title['#text'] || it.title : it.title) || ''

        // link: RSS often has link as string; Atom may have link object
        let link = ''
        if (it.link) {
          if (typeof it.link === 'string') link = it.link
          else if (Array.isArray(it.link)) {
            // pick alternate or href
            const alt = it.link.find((l) => l['@_rel'] === 'alternate' && l['@_href'])
            if (alt) link = alt['@_href']
            else if (it.link[0]['@_href']) link = it.link[0]['@_href']
            else if (it.link[0]) link = it.link[0]
          } else if (it.link['@_href']) link = it.link['@_href']
          else if (it.link['#text']) link = it.link['#text']
        }
        if (!link && it.enclosure && it.enclosure['@_url']) link = it.enclosure['@_url']

        // published date
        const pub = it.pubDate || it.published || it.updated || it['dc:date'] || null
        const publishedAt = pub ? new Date(pub).toISOString() : new Date().toISOString()

        // description / content
        const description = it.description || it.summary || it.content || (it['content:encoded'] && it['content:encoded']) || ''

        // image: enclosure, media:content, or in description HTML
        let image = null
        if (it.enclosure && (it.enclosure['@_url'] || it.enclosure.url)) image = it.enclosure['@_url'] || it.enclosure.url
        if (!image && it['media:content'] && (it['media:content']['@_url'] || it['media:content'].url)) image = it['media:content']['@_url'] || it['media:content'].url
        if (!image) image = extractImageFromHtml(description)

        if (!title || !link) continue

        articles.push({
          title: String(title).trim(),
          source: feed.source,
          publishedAt,
          image: image || null,
          description: stripHtml(description),
          url: link
        })
      }
    }

    // Dedupe by URL
    const seen = new Set()
    const deduped = articles.filter((a) => {
      if (!a.url) return false
      if (seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })

    // Sort by published date desc
    deduped.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    const latest = deduped.slice(0, 10)

    return res.json({ status: 'success', count: latest.length, news: latest })
  } catch (err) {
    console.error('RSS fetch error', err)
    return res.status(500).json({ error: 'Failed to fetch RSS feeds', status: 500 })
  }
})

export default router
