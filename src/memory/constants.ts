export const DB_NAME = 'cleantab_memory'
export const DB_VERSION = 1

export const STORES = {
  BROWSING_EVENTS: 'browsing_events',
  PAGE_CONTENT: 'page_content',
  PAGE_EMBEDDINGS: 'page_embeddings',
} as const

// URLs matching these protocols are never captured
export const IGNORED_PROTOCOLS = ['chrome:', 'chrome-extension:', 'about:', 'data:', 'blob:', 'devtools:']

// Tracking params stripped during URL normalization
export const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'fbclid', 'gclid', 'dclid', 'msclkid', 'twclid',
  'source', 'mc_cid', 'mc_eid',
]
