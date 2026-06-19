interface AdminTableEmptyStateProps {
  colSpan: number
  message?: string
}

export default function AdminTableEmptyState({
  colSpan,
  message = 'No data found',
}: AdminTableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <div className="flex min-h-[min(22rem,48vh)] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200/80"
            aria-hidden
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12h6M9 16h6M7 4h10l2 4v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-500">{message}</p>
        </div>
      </td>
    </tr>
  )
}
