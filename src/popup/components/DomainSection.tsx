import { useState } from 'react'
import type { DomainGroup } from '../../core/types'
import TabRow from './TabRow'

interface DomainSectionProps {
  group: DomainGroup
  selectedTabs: Set<number>
  onSelectTab: (tabId: number) => void
  onNavigateTab: (tabId: number) => void
  onCloseTab: (tabId: number) => void
}

export default function DomainSection({
  group,
  selectedTabs,
  onSelectTab,
  onNavigateTab,
  onCloseTab,
}: DomainSectionProps) {
  const [expanded, setExpanded] = useState(true)

  const selectedInGroup = group.tabs.filter((t) => selectedTabs.has(t.id)).length

  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-left"
      >
        <svg
          className={`w-3 h-3 text-neutral-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {group.friendlyName}
        </span>
        <span className="text-xs text-neutral-400">
          {group.tabs.length}
          {selectedInGroup > 0 && ` / ${selectedInGroup} selected`}
        </span>
      </button>
      {expanded && (
        <div>
          {group.tabs.map((tab) => (
            <TabRow
              key={tab.id}
              tab={tab}
              selected={selectedTabs.has(tab.id)}
              onSelect={onSelectTab}
              onNavigate={onNavigateTab}
              onClose={onCloseTab}
            />
          ))}
        </div>
      )}
    </div>
  )
}
