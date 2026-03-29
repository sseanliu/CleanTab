export function extractMetadata() {
  const getMeta = (selector: string): string | null => {
    const el = document.querySelector(selector)
    return el?.getAttribute('content') ?? null
  }

  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .slice(0, 10)
    .map(h => (h.textContent || '').trim())
    .filter(Boolean)

  // Extract Schema.org LD-JSON structured data
  const schemaOrg = extractSchemaOrg()

  // Derive content type from OG type, schema.org, or URL heuristics
  const ogType = getMeta('meta[property="og:type"]')
  const contentType = inferContentType(ogType, schemaOrg, window.location.href)

  // Extract author from meta tags or schema.org
  const author = getMeta('meta[name="author"]')
    || getMeta('meta[property="article:author"]')
    || schemaOrg?.author
    || null

  // Extract publish date
  const publishedDate = getMeta('meta[property="article:published_time"]')
    || getMeta('meta[name="date"]')
    || schemaOrg?.datePublished
    || null

  // Extract keywords/tags
  const keywordsMeta = getMeta('meta[name="keywords"]')
  const keywords = keywordsMeta
    ? keywordsMeta.split(',').map(k => k.trim()).filter(Boolean).slice(0, 20)
    : []

  // Extract site name
  const siteName = getMeta('meta[property="og:site_name"]') || null

  // Extract a text summary from the page body (first meaningful paragraph)
  const excerpt = extractExcerpt()

  return {
    url: window.location.href,
    title: document.title || '',
    description: getMeta('meta[name="description"]'),
    ogTitle: getMeta('meta[property="og:title"]'),
    ogDescription: getMeta('meta[property="og:description"]'),
    ogImage: getMeta('meta[property="og:image"]'),
    ogType,
    headings,
    canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    lang: document.documentElement.lang || null,
    schemaType: schemaOrg?.type ?? null,
    author,
    publishedDate,
    siteName,
    keywords,
    excerpt,
    contentType,
  }
}

interface SchemaOrgData {
  type: string
  author: string | null
  datePublished: string | null
  description: string | null
}

function extractSchemaOrg(): SchemaOrgData | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '')
      const item = Array.isArray(data) ? data[0] : data

      // Handle @graph pattern (common on WordPress, news sites)
      const mainItem = item?.['@graph']
        ? item['@graph'].find((g: Record<string, unknown>) =>
            typeof g['@type'] === 'string' && g['@type'] !== 'WebSite' && g['@type'] !== 'WebPage' && g['@type'] !== 'BreadcrumbList'
          ) || item['@graph'][0]
        : item

      if (!mainItem?.['@type']) continue

      const type = Array.isArray(mainItem['@type']) ? mainItem['@type'][0] : mainItem['@type']

      let author: string | null = null
      if (mainItem.author) {
        if (typeof mainItem.author === 'string') author = mainItem.author
        else if (Array.isArray(mainItem.author)) author = mainItem.author[0]?.name || null
        else author = mainItem.author.name || null
      }

      return {
        type,
        author,
        datePublished: mainItem.datePublished || mainItem.dateCreated || null,
        description: mainItem.description || null,
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null
}

function inferContentType(
  ogType: string | null,
  schema: SchemaOrgData | null,
  url: string
): string {
  // Schema.org type mapping
  if (schema?.type) {
    const t = schema.type.toLowerCase()
    if (t.includes('article') || t.includes('newsarticle') || t.includes('blogposting')) return 'article'
    if (t.includes('video') || t.includes('movie')) return 'video'
    if (t.includes('product')) return 'product'
    if (t.includes('recipe')) return 'recipe'
    if (t.includes('person')) return 'profile'
    if (t.includes('softwareapplication') || t.includes('webapp')) return 'app'
    if (t.includes('repository') || t.includes('softwaresourcecode')) return 'code'
    if (t.includes('scholarlyarticle') || t.includes('dataset')) return 'paper'
  }

  // OG type mapping
  if (ogType) {
    if (ogType === 'article') return 'article'
    if (ogType === 'video' || ogType.startsWith('video.')) return 'video'
    if (ogType === 'music' || ogType.startsWith('music.')) return 'music'
    if (ogType === 'profile') return 'profile'
    if (ogType === 'product') return 'product'
  }

  // URL-based heuristics
  const hostname = new URL(url).hostname
  if (hostname.includes('github.com')) return 'code'
  if (hostname.includes('arxiv.org') || hostname.includes('scholar.google')) return 'paper'
  if (hostname.includes('youtube.com') || hostname.includes('vimeo.com')) return 'video'
  if (hostname.includes('twitter.com') || hostname.includes('x.com') || hostname.includes('reddit.com')) return 'social'
  if (hostname.includes('linkedin.com')) return 'social'
  if (hostname.includes('docs.google.com') || hostname.includes('notion.so')) return 'docs'
  if (hostname.includes('stackoverflow.com') || hostname.includes('dev.to')) return 'forum'

  return 'other'
}

function extractExcerpt(): string | null {
  // Get the first meaningful paragraph from the page
  const paragraphs = document.querySelectorAll('article p, main p, .content p, .post p, p')
  for (const p of paragraphs) {
    const text = (p.textContent || '').trim()
    // Skip very short or navigation-like text
    if (text.length > 50 && text.length < 1000) {
      return text.slice(0, 300)
    }
  }
  return null
}
