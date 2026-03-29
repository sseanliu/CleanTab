import { shouldCapture, normalizeUrl, buildBrowsingEvent } from '../memory/capture'
import { addBrowsingEvent, upsertPageContent, updateEventDwellTime, updatePageMetadata } from '../memory/db'
import type { ExtractedMetadata } from '../memory/types'

// Track active tab for dwell time calculation
let activeTabState: {
  tabId: number
  eventId: string
  activatedAt: number
} | null = null

export function handleNavigationCompleted(
  details: chrome.webNavigation.WebNavigationFramedCallbackDetails
) {
  // Only capture main frame navigations
  if (details.frameId !== 0) return

  const url = details.url
  if (!shouldCapture(url)) return

  // Get tab title, then log the event
  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return

    const title = tab.title || 'Untitled'
    const event = buildBrowsingEvent(url, title)
    const now = event.timestamp

    addBrowsingEvent(event).catch(console.error)
    upsertPageContent(event.normalizedUrl, url, event.domain, title, now).catch(console.error)

    // If this is the active tab, start tracking dwell time
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id === details.tabId) {
        activeTabState = {
          tabId: details.tabId,
          eventId: event.id,
          activatedAt: now,
        }
      }
    })
  })
}

export function handleTabActivated(activeInfo: chrome.tabs.OnActivatedInfo) {
  const now = Date.now()

  // Finalize dwell time for the previously active tab
  if (activeTabState) {
    const dwellTime = now - activeTabState.activatedAt
    updateEventDwellTime(activeTabState.eventId, dwellTime).catch(console.error)
  }

  // Start tracking the newly active tab
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url || !shouldCapture(tab.url)) {
      activeTabState = null
      return
    }

    // We don't create a new browsing event for tab switches,
    // just track for dwell time. The event was created on navigation.
    // Use a placeholder eventId - dwell time will be set on next switch
    activeTabState = {
      tabId: activeInfo.tabId,
      eventId: '', // no event to update until next navigation
      activatedAt: now,
    }
  })
}

export function handleTabRemoved(tabId: number) {
  if (activeTabState?.tabId === tabId) {
    const dwellTime = Date.now() - activeTabState.activatedAt
    if (activeTabState.eventId) {
      updateEventDwellTime(activeTabState.eventId, dwellTime).catch(console.error)
    }
    activeTabState = null
  }
}

export function handleMetadataExtracted(metadata: ExtractedMetadata) {
  const normalizedUrl = normalizeUrl(metadata.url)

  updatePageMetadata(normalizedUrl, {
    description: metadata.ogDescription || metadata.description,
    ogImage: metadata.ogImage,
    headings: metadata.headings,
  }).catch(console.error)
}
