export const SOURCE_LOGO_MAP = {
  TechCrunch: 'https://logo.clearbit.com/techcrunch.com?size=256',
  'The Verge': 'https://logo.clearbit.com/theverge.com?size=256',
  'Ars Technica': 'https://logo.clearbit.com/arstechnica.com?size=256',
  Wired: 'https://logo.clearbit.com/wired.com?size=256'
}

const GENERIC_NEWS_IMAGE =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"%3E%3Crect width="400" height="240" fill="%23222"/%3E%3Ctext x="200" y="120" fill="%23fff" font-family="Arial,Helvetica,sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle"%3ETech News%3C/text%3E%3C/svg%3E'

export const getSourceLogoUrl = (source) => SOURCE_LOGO_MAP[source] || null

export const getArticleImageUrl = (article) => {
  if (article?.image) return article.image
  const logoUrl = getSourceLogoUrl(article?.source)
  return logoUrl || GENERIC_NEWS_IMAGE
}

export const getArticleImageFallback = () => GENERIC_NEWS_IMAGE
