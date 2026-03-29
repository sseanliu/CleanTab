import { DB_NAME, DB_VERSION, STORES } from './constants'
import type { BrowsingEvent, PageContent } from './types'

let dbInstance: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      // browsing_events store
      if (!db.objectStoreNames.contains(STORES.BROWSING_EVENTS)) {
        const events = db.createObjectStore(STORES.BROWSING_EVENTS, { keyPath: 'id' })
        events.createIndex('url', 'url', { unique: false })
        events.createIndex('normalizedUrl', 'normalizedUrl', { unique: false })
        events.createIndex('domain', 'domain', { unique: false })
        events.createIndex('timestamp', 'timestamp', { unique: false })
        events.createIndex('domain_timestamp', ['domain', 'timestamp'], { unique: false })
        events.createIndex('normalizedUrl_timestamp', ['normalizedUrl', 'timestamp'], { unique: false })
      }

      // page_content store
      if (!db.objectStoreNames.contains(STORES.PAGE_CONTENT)) {
        const pages = db.createObjectStore(STORES.PAGE_CONTENT, { keyPath: 'normalizedUrl' })
        pages.createIndex('domain', 'domain', { unique: false })
        pages.createIndex('lastSeenAt', 'lastSeenAt', { unique: false })
        pages.createIndex('enrichedAt', 'enrichedAt', { unique: false })
        pages.createIndex('visitCount', 'visitCount', { unique: false })
      }

      // page_embeddings store
      if (!db.objectStoreNames.contains(STORES.PAGE_EMBEDDINGS)) {
        const embeddings = db.createObjectStore(STORES.PAGE_EMBEDDINGS, { keyPath: 'normalizedUrl' })
        embeddings.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      dbInstance.onclose = () => { dbInstance = null }
      resolve(dbInstance)
    }

    request.onerror = () => reject(request.error)
  })
}

// --- Browsing Events ---

export async function addBrowsingEvent(event: BrowsingEvent): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BROWSING_EVENTS, 'readwrite')
    tx.objectStore(STORES.BROWSING_EVENTS).add(event)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function updateEventDwellTime(eventId: string, dwellTimeMs: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BROWSING_EVENTS, 'readwrite')
    const store = tx.objectStore(STORES.BROWSING_EVENTS)
    const req = store.get(eventId)
    req.onsuccess = () => {
      const event = req.result
      if (event) {
        event.dwellTimeMs = dwellTimeMs
        store.put(event)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// --- Page Content ---

export async function upsertPageContent(
  normalizedUrl: string,
  url: string,
  domain: string,
  title: string,
  now: number
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PAGE_CONTENT, 'readwrite')
    const store = tx.objectStore(STORES.PAGE_CONTENT)
    const req = store.get(normalizedUrl)

    req.onsuccess = () => {
      const existing = req.result as PageContent | undefined
      if (existing) {
        existing.title = title
        existing.lastSeenAt = now
        existing.visitCount += 1
        store.put(existing)
      } else {
        store.add({
          normalizedUrl,
          url,
          domain,
          title,
          description: null,
          ogImage: null,
          headings: [],
          contentType: null,
          schemaType: null,
          author: null,
          publishedDate: null,
          siteName: null,
          keywords: [],
          excerpt: null,
          firstSeenAt: now,
          lastSeenAt: now,
          visitCount: 1,
          enrichedAt: null,
        })
      }
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function updatePageMetadata(
  normalizedUrl: string,
  metadata: {
    description?: string | null
    ogImage?: string | null
    headings?: string[]
    contentType?: string | null
    schemaType?: string | null
    author?: string | null
    publishedDate?: string | null
    siteName?: string | null
    keywords?: string[]
    excerpt?: string | null
  }
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PAGE_CONTENT, 'readwrite')
    const store = tx.objectStore(STORES.PAGE_CONTENT)
    const req = store.get(normalizedUrl)

    req.onsuccess = () => {
      const existing = req.result as PageContent | undefined
      if (existing) {
        if (metadata.description !== undefined) existing.description = metadata.description
        if (metadata.ogImage !== undefined) existing.ogImage = metadata.ogImage
        if (metadata.headings !== undefined) existing.headings = metadata.headings
        if (metadata.contentType !== undefined) existing.contentType = metadata.contentType
        if (metadata.schemaType !== undefined) existing.schemaType = metadata.schemaType
        if (metadata.author !== undefined) existing.author = metadata.author
        if (metadata.publishedDate !== undefined) existing.publishedDate = metadata.publishedDate
        if (metadata.siteName !== undefined) existing.siteName = metadata.siteName
        if (metadata.keywords !== undefined) existing.keywords = metadata.keywords
        if (metadata.excerpt !== undefined) existing.excerpt = metadata.excerpt
        store.put(existing)
      }
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getRecentPages(limit: number = 50): Promise<PageContent[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PAGE_CONTENT, 'readonly')
    const store = tx.objectStore(STORES.PAGE_CONTENT)
    const index = store.index('lastSeenAt')
    const results: PageContent[] = []

    const request = index.openCursor(null, 'prev')
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor && results.length < limit) {
        results.push(cursor.value)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function searchPages(query: string, limit: number = 50): Promise<PageContent[]> {
  const db = await openDB()
  const lowerQuery = query.toLowerCase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PAGE_CONTENT, 'readonly')
    const store = tx.objectStore(STORES.PAGE_CONTENT)
    const index = store.index('lastSeenAt')
    const results: PageContent[] = []

    const request = index.openCursor(null, 'prev')
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor || results.length >= limit) {
        resolve(results)
        return
      }

      const page = cursor.value as PageContent
      const matches =
        page.title.toLowerCase().includes(lowerQuery) ||
        page.normalizedUrl.toLowerCase().includes(lowerQuery) ||
        (page.description?.toLowerCase().includes(lowerQuery) ?? false) ||
        page.headings.some(h => h.toLowerCase().includes(lowerQuery)) ||
        (page.author?.toLowerCase().includes(lowerQuery) ?? false) ||
        (page.excerpt?.toLowerCase().includes(lowerQuery) ?? false) ||
        page.keywords.some(k => k.toLowerCase().includes(lowerQuery)) ||
        (page.contentType?.toLowerCase().includes(lowerQuery) ?? false)

      if (matches) {
        results.push(page)
      }
      cursor.continue()
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getStats(): Promise<{
  totalEvents: number
  uniquePages: number
  topDomains: Array<{ domain: string; count: number }>
}> {
  const db = await openDB()

  const totalEvents = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORES.BROWSING_EVENTS, 'readonly')
    const req = tx.objectStore(STORES.BROWSING_EVENTS).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  const pages = await new Promise<PageContent[]>((resolve, reject) => {
    const tx = db.transaction(STORES.PAGE_CONTENT, 'readonly')
    const req = tx.objectStore(STORES.PAGE_CONTENT).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  const domainCounts = new Map<string, number>()
  for (const page of pages) {
    domainCounts.set(page.domain, (domainCounts.get(page.domain) || 0) + page.visitCount)
  }

  const topDomains = Array.from(domainCounts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return { totalEvents, uniquePages: pages.length, topDomains }
}
