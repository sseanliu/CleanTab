import type { PageContent } from '../../../memory/types'
import { getFriendlyName, getFaviconUrl } from '../../../core/domain-utils'

interface HistoryItemProps {
  page: PageContent
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function HistoryItem({ page }: HistoryItemProps) {
  const faviconSrc = getFaviconUrl(page.url)
  const friendlyName = getFriendlyName(page.domain)

  const handleClick = () => {
    chrome.tabs.create({ url: page.url })
    window.close()
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
    >
      {faviconSrc ? (
        <img
          src={faviconSrc}
          alt=""
          className="w-4 h-4 shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-4 h-4 shrink-0 rounded bg-neutral-300 dark:bg-neutral-600" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-neutral-800 dark:text-neutral-200 truncate" title={page.title}>
          {page.title}
        </div>
        {page.description && (
          <div className="text-xs text-neutral-400 truncate" title={page.description}>
            {page.description}
          </div>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span className="text-[10px] text-neutral-400">{timeAgo(page.lastSeenAt)}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
          {friendlyName}
        </span>
      </div>
      {page.visitCount > 1 && (
        <span className="shrink-0 text-[10px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          {page.visitCount}x
        </span>
      )}
    </div>
  )
}
