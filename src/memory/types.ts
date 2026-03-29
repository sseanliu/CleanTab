export interface BrowsingEvent {
  id: string
  url: string
  normalizedUrl: string
  domain: string
  title: string
  timestamp: number
  dwellTimeMs: number | null
  transitionType: string | null
}

export interface PageContent {
  normalizedUrl: string
  url: string
  domain: string
  title: string
  description: string | null
  ogImage: string | null
  headings: string[]
  contentType: string | null
  schemaType: string | null
  author: string | null
  publishedDate: string | null
  siteName: string | null
  keywords: string[]
  excerpt: string | null
  firstSeenAt: number
  lastSeenAt: number
  visitCount: number
  enrichedAt: number | null
}

export interface PageEmbedding {
  normalizedUrl: string
  vector: Float32Array
  inputText: string
  modelId: string
  createdAt: number
}

export interface ExtractedMetadata {
  url: string
  title: string
  description: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  ogType: string | null
  headings: string[]
  canonicalUrl: string | null
  lang: string | null
  schemaType: string | null
  author: string | null
  publishedDate: string | null
  siteName: string | null
  keywords: string[]
  excerpt: string | null
  contentType: string
}

export type Message =
  | { type: 'METADATA_EXTRACTED'; payload: ExtractedMetadata }
  | { type: 'QUERY_HISTORY'; payload: HistoryQuery }
  | { type: 'QUERY_HISTORY_RESULT'; payload: PageContent[] }
  | { type: 'GET_STATS'; }
  | { type: 'GET_STATS_RESULT'; payload: BrowsingStats }

export interface HistoryQuery {
  query?: string
  domain?: string
  from?: number
  to?: number
  limit?: number
}

export interface BrowsingStats {
  totalEvents: number
  uniquePages: number
  topDomains: Array<{ domain: string; count: number }>
}
