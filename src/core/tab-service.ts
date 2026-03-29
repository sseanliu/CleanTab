import type { TabInfo, DomainGroup } from './types'
import { extractDomain, getFriendlyName } from './domain-utils'

export async function getAllTabs(): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  return tabs
    .filter((tab) => tab.id !== undefined)
    .map((tab) => {
      const domain = extractDomain(tab.url ?? '')
      return {
        id: tab.id!,
        title: tab.title || 'Untitled',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl || '',
        domain,
        friendlyDomain: getFriendlyName(domain),
      }
    })
}

export function groupByDomain(tabs: TabInfo[]): DomainGroup[] {
  const map = new Map<string, TabInfo[]>()

  for (const tab of tabs) {
    const existing = map.get(tab.domain)
    if (existing) {
      existing.push(tab)
    } else {
      map.set(tab.domain, [tab])
    }
  }

  const groups: DomainGroup[] = []
  for (const [domain, domainTabs] of map) {
    groups.push({
      domain,
      friendlyName: getFriendlyName(domain),
      tabs: domainTabs,
    })
  }

  // Sort by tab count descending, then alphabetically
  groups.sort((a, b) => {
    if (b.tabs.length !== a.tabs.length) return b.tabs.length - a.tabs.length
    return a.friendlyName.localeCompare(b.friendlyName)
  })

  return groups
}

export async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId)
}

export async function closeTabs(tabIds: number[]): Promise<void> {
  await chrome.tabs.remove(tabIds)
}

export async function navigateToTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { active: true })
}

export function findDuplicateTabIds(tabs: TabInfo[]): number[] {
  const seen = new Map<string, number>()
  const duplicateIds: number[] = []

  for (const tab of tabs) {
    if (!tab.url || tab.url === 'chrome://newtab/') continue
    if (seen.has(tab.url)) {
      duplicateIds.push(tab.id)
    } else {
      seen.set(tab.url, tab.id)
    }
  }

  return duplicateIds
}

export async function closeDuplicates(tabs: TabInfo[]): Promise<number> {
  const ids = findDuplicateTabIds(tabs)
  if (ids.length > 0) {
    await chrome.tabs.remove(ids)
  }
  return ids.length
}
