interface ActionBarProps {
  selectedCount: number
  totalCount: number
  onCloseSelected: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export default function ActionBar({
  selectedCount,
  totalCount,
  onCloseSelected,
  onSelectAll,
  onDeselectAll,
}: ActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {selectedCount} selected
        </span>
        {selectedCount < totalCount ? (
          <button
            onClick={onSelectAll}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            Select all
          </button>
        ) : (
          <button
            onClick={onDeselectAll}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            Deselect all
          </button>
        )}
      </div>
      <button
        onClick={onCloseSelected}
        className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
      >
        Close {selectedCount}
      </button>
    </div>
  )
}
