import type { Message } from '../memory/types'
import { handleMetadataExtracted } from './event-handlers'
import { searchPages, getRecentPages, getStats } from '../memory/db'

export function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): boolean {
  switch (message.type) {
    case 'METADATA_EXTRACTED':
      handleMetadataExtracted(message.payload)
      return false

    case 'QUERY_HISTORY': {
      const { query, limit } = message.payload
      const fn = query ? searchPages(query, limit) : getRecentPages(limit)
      fn.then((results) => sendResponse({ type: 'QUERY_HISTORY_RESULT', payload: results }))
        .catch((err) => sendResponse({ type: 'QUERY_HISTORY_RESULT', payload: [], error: String(err) }))
      return true // keep message channel open for async response
    }

    case 'GET_STATS':
      getStats()
        .then((stats) => sendResponse({ type: 'GET_STATS_RESULT', payload: stats }))
        .catch((err) => sendResponse({ type: 'GET_STATS_RESULT', payload: null, error: String(err) }))
      return true

    default:
      return false
  }
}
