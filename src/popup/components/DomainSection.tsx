import { useState } from 'react'
import type { DomainGroup } from '../../core/types'
import TabRow from './TabRow'

interface DomainSectionProps {
  group: DomainGroup
  selectedTabs: Set<number>
  onSelectTab: (tabId: number) => void
  onSelectGroup: (tabIds: number[]) => void
  onDeselectGroup: (tabIds: number[]) => void
  onNavigateTab: (tabId: number) => void
  onCloseTab: (tabId: number) => void
}

export default function DomainSection({
  group,
  selectedTabs,
  onSelectTab,
  onSelectGroup,
  onDeselectGroup,
  onNavigateTab,
  onCloseTab,
}: DomainSectionProps) {
  const [expanded, setExpanded] = useState(true)

  const groupTabIds = group.tabs.map((t) => t.id)
  const selectedInGroup = group.tabs.filter((t) => selectedTabs.has(t.id)).length
  const allSelected = selectedInGroup === group.tabs.length

  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = selectedInGroup > 0 && !allSelected
          }}
          onChange={() => {
            if (allSelected) {
              onDeselectGroup(groupTabIds)
            } else {
              onSelectGroup(groupTabIds)
            }
          }}
          className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-neutral-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 shrink-0 cursor-pointer"
        />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 text-left"
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
      </div>
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
