import { useState, useEffect, useCallback } from 'react'
import type { DomainGroup } from '../core/types'
import { getAllTabs, groupByDomain, closeTab, closeTabs, navigateToTab, findDuplicateTabIds } from '../core/tab-service'
import SearchBar from './components/SearchBar'
import DomainSection from './components/DomainSection'
import ActionBar from './components/ActionBar'
import EmptyState from './components/EmptyState'
import HistoryView from './components/history/HistoryView'

type View = 'tabs' | 'history'

export default function App() {
  const [view, setView] = useState<View>('tabs')
  const [groups, setGroups] = useState<DomainGroup[]>([])
  const [search, setSearch] = useState('')
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set())
  const [allExpanded, setAllExpanded] = useState(true)

  const loadTabs = useCallback(async () => {
    const tabs = await getAllTabs()
    setGroups(groupByDomain(tabs))
  }, [])

  useEffect(() => {
    loadTabs()

    const onRemoved = () => {
      loadTabs()
      setSelectedTabs((prev) => {
        const next = new Set(prev)
        // Stale IDs will be cleaned on next render
        return next
      })
    }
    const onCreated = () => loadTabs()
    const onUpdated = () => loadTabs()

    chrome.tabs.onRemoved.addListener(onRemoved)
    chrome.tabs.onCreated.addListener(onCreated)
    chrome.tabs.onUpdated.addListener(onUpdated)

    return () => {
      chrome.tabs.onRemoved.removeListener(onRemoved)
      chrome.tabs.onCreated.removeListener(onCreated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [loadTabs])

  const filteredGroups = search
    ? groups
        .map((group) => ({
          ...group,
          tabs: group.tabs.filter(
            (tab) =>
              tab.title.toLowerCase().includes(search.toLowerCase()) ||
              tab.url.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((group) => group.tabs.length > 0)
    : groups

  const allTabs = groups.flatMap((g) => g.tabs)
  const allTabIds = filteredGroups.flatMap((g) => g.tabs.map((t) => t.id))
  const totalCount = allTabIds.length
  const duplicateIds = findDuplicateTabIds(allTabs)
  const duplicateSet = new Set(duplicateIds)
  const duplicateCount = duplicateIds.length

  const handleSelectTab = (tabId: number) => {
    setSelectedTabs((prev) => {
      const next = new Set(prev)
      if (next.has(tabId)) {
        next.delete(tabId)
      } else {
        next.add(tabId)
      }
      return next
    })
  }

  const handleSelectGroup = (tabIds: number[]) => {
    setSelectedTabs((prev) => {
      const next = new Set(prev)
      for (const id of tabIds) next.add(id)
      return next
    })
  }

  const handleDeselectGroup = (tabIds: number[]) => {
    setSelectedTabs((prev) => {
      const next = new Set(prev)
      for (const id of tabIds) next.delete(id)
      return next
    })
  }

  const handleNavigateTab = async (tabId: number) => {
    await navigateToTab(tabId)
    window.close()
  }

  const handleCloseTab = async (tabId: number) => {
    await closeTab(tabId)
    setSelectedTabs((prev) => {
      const next = new Set(prev)
      next.delete(tabId)
      return next
    })
  }

  const handleCloseSelected = async () => {
    const ids = Array.from(selectedTabs)
    await closeTabs(ids)
    setSelectedTabs(new Set())
  }

  const duplicatesSelected = duplicateIds.length > 0 && duplicateIds.every((id) => selectedTabs.has(id))

  const handleToggleDuplicates = () => {
    if (duplicatesSelected) {
      setSelectedTabs((prev) => {
        const next = new Set(prev)
        for (const id of duplicateIds) next.delete(id)
        return next
      })
    } else {
      setSelectedTabs(new Set(duplicateIds))
    }
  }

  const handleSelectAll = () => {
    setSelectedTabs(new Set(allTabIds))
  }

  const handleDeselectAll = () => {
    setSelectedTabs(new Set())
  }

  if (view === 'history') {
    return (
      <div className="w-[400px] h-[500px] flex flex-col bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setView('tabs')}
            className="flex-1 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Tabs
          </button>
          <button
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-500 border-b-2 border-blue-500"
          >
            History
          </button>
        </div>
        <HistoryView />
      </div>
    )
  }

  return (
    <div className="w-[400px] h-[500px] flex flex-col bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700">
        <button
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-500 border-b-2 border-blue-500"
        >
          Tabs
        </button>
        <button
          onClick={() => setView('history')}
          className="flex-1 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          History
        </button>
      </div>
      <SearchBar value={search} onChange={setSearch} />

      <div className="px-3 py-1.5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-xs text-neutral-500">{totalCount} tabs</span>
        <div className="flex items-center gap-3">
          {duplicateCount > 0 && (
            <button
              onClick={handleToggleDuplicates}
              className={`text-xs ${duplicatesSelected ? 'text-neutral-500 hover:text-neutral-600' : 'text-red-500 hover:text-red-600'}`}
            >
              {duplicatesSelected ? 'Deselect duplicates' : `${duplicateCount} duplicates`}
            </button>
          )}
          {totalCount > 0 && (
            <button
              onClick={() => setAllExpanded(!allExpanded)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
          {totalCount > 0 && selectedTabs.size === 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Select all
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 && search ? (
          <EmptyState search={search} />
        ) : (
          filteredGroups.map((group) => (
            <DomainSection
              key={group.domain}
              group={group}
              selectedTabs={selectedTabs}
              onSelectTab={handleSelectTab}
              onSelectGroup={handleSelectGroup}
              onDeselectGroup={handleDeselectGroup}
              onNavigateTab={handleNavigateTab}
              onCloseTab={handleCloseTab}
              forceExpanded={allExpanded}
              duplicateTabs={duplicateSet}
            />
          ))
        )}
      </div>

      <ActionBar
        selectedCount={selectedTabs.size}
        totalCount={totalCount}
        onCloseSelected={handleCloseSelected}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />
    </div>
  )
}
