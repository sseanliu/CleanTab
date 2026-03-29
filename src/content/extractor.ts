export function extractMetadata() {
  const getMeta = (selector: string): string | null => {
    const el = document.querySelector(selector)
    return el?.getAttribute('content') ?? null
  }

  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .slice(0, 10)
    .map(h => (h.textContent || '').trim())
    .filter(Boolean)

  return {
    url: window.location.href,
    title: document.title || '',
    description: getMeta('meta[name="description"]'),
    ogTitle: getMeta('meta[property="og:title"]'),
    ogDescription: getMeta('meta[property="og:description"]'),
    ogImage: getMeta('meta[property="og:image"]'),
    ogType: getMeta('meta[property="og:type"]'),
    headings,
    canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    lang: document.documentElement.lang || null,
  }
}
