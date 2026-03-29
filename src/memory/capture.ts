import { IGNORED_PROTOCOLS, TRACKING_PARAMS } from './constants'
import { extractDomain } from '../core/domain-utils'

export function shouldCapture(url: string): boolean {
  if (!url) return false
  for (const protocol of IGNORED_PROTOCOLS) {
    if (url.startsWith(protocol)) return false
  }
  return true
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // Strip fragment
    parsed.hash = ''

    // Strip tracking params
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param)
    }

    // Sort remaining params for consistency
    parsed.searchParams.sort()

    let result = parsed.toString()

    // Strip trailing slash (but keep root paths like "https://example.com/")
    if (result.endsWith('/') && parsed.pathname !== '/') {
      result = result.slice(0, -1)
    }

    return result
  } catch {
    return url
  }
}

export function buildBrowsingEvent(
  url: string,
  title: string,
  transitionType: string | null = null
) {
  const normalizedUrl = normalizeUrl(url)
  return {
    id: crypto.randomUUID(),
    url,
    normalizedUrl,
    domain: extractDomain(url),
    title: title || 'Untitled',
    timestamp: Date.now(),
    dwellTimeMs: null,
    transitionType,
  }
}

export function buildPageContentStub(
  url: string,
  normalizedUrl: string,
  domain: string,
  title: string,
  now: number
) {
  return {
    normalizedUrl,
    url,
    domain,
    title,
    description: null,
    ogImage: null,
    headings: [] as string[],
    contentType: null,
    firstSeenAt: now,
    lastSeenAt: now,
    visitCount: 1,
    enrichedAt: null,
  }
}
