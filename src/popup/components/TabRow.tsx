import type { TabInfo } from '../../core/types'
import { getFaviconUrl } from '../../core/domain-utils'

interface TabRowProps {
  tab: TabInfo
  selected: boolean
  onSelect: (tabId: number) => void
  onNavigate: (tabId: number) => void
  onClose: (tabId: number) => void
}

export default function TabRow({ tab, selected, onSelect, onNavigate, onClose }: TabRowProps) {
  const faviconSrc = tab.favIconUrl || getFaviconUrl(tab.url)

  return (
    <div
      className="group flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
      onClick={() => onNavigate(tab.id)}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => {
          e.stopPropagation()
          onSelect(tab.id)
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-neutral-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 shrink-0 cursor-pointer"
      />
      {faviconSrc ? (
        <img
          src={faviconSrc}
          alt=""
          className="w-4 h-4 shrink-0"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="w-4 h-4 shrink-0 rounded bg-neutral-300 dark:bg-neutral-600" />
      )}
      <span className="flex-1 text-sm text-neutral-800 dark:text-neutral-200 truncate" title={tab.title}>
        {tab.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(tab.id)
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-500 transition-opacity shrink-0"
        title="Close tab"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
