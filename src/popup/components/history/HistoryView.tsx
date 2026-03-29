import { useState, useEffect, useCallback } from 'react'
import type { PageContent } from '../../../memory/types'
import { getRecentPages, searchPages, getStats } from '../../../memory/db'
import HistorySearchBar from './HistorySearchBar'
import HistoryItem from './HistoryItem'

export default function HistoryView() {
  const [pages, setPages] = useState<PageContent[]>([])
  const [search, setSearch] = useState('')
  const [statsText, setStatsText] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const results = query
        ? await searchPages(query, 100)
        : await getRecentPages(100)
      setPages(results)
    } catch (err) {
      console.error('Failed to load history:', err)
      setPages([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData('')
    getStats().then((s) => {
      setStatsText(`${s.uniquePages} pages, ${s.totalEvents} visits`)
    }).catch(() => {})
  }, [loadData])

  useEffect(() => {
    const timer = setTimeout(() => loadData(search), 200)
    return () => clearTimeout(timer)
  }, [search, loadData])

  // Group pages by day
  const groupedByDay = pages.reduce<Map<string, PageContent[]>>((acc, page) => {
    const date = new Date(page.lastSeenAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const existing = acc.get(date)
    if (existing) existing.push(page)
    else acc.set(date, [page])
    return acc
  }, new Map())

  return (
    <div className="flex flex-col h-full">
      <HistorySearchBar value={search} onChange={setSearch} />

      {statsText && !search && (
        <div className="px-3 pb-2 text-[10px] text-neutral-400">
          {statsText}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading && pages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-neutral-400 text-sm">
            Loading...
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">
              {search ? `No results for "${search}"` : 'No browsing history yet'}
            </p>
            {!search && (
              <p className="text-xs mt-1">Browse some pages and they'll appear here</p>
            )}
          </div>
        ) : (
          Array.from(groupedByDay.entries()).map(([day, dayPages]) => (
            <div key={day}>
              <div className="sticky top-0 bg-white dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
                {day}
              </div>
              {dayPages.map((page) => (
                <HistoryItem key={page.normalizedUrl} page={page} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
