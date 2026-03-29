export default function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <p className="text-sm">No tabs matching "{search}"</p>
    </div>
  )
}
