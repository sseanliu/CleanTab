import { handleNavigationCompleted, handleTabActivated, handleTabRemoved } from './event-handlers'
import { handleMessage } from './message-router'

// Listen for completed navigations (main frame only)
chrome.webNavigation.onCompleted.addListener(handleNavigationCompleted)

// Track tab focus for dwell time
chrome.tabs.onActivated.addListener(handleTabActivated)

// Finalize dwell time on tab close
chrome.tabs.onRemoved.addListener(handleTabRemoved)

// Route messages from popup, content scripts, offscreen
chrome.runtime.onMessage.addListener(handleMessage)
