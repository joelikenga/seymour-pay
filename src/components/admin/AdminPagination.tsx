import { buildPaginationRange } from '../../lib/paginationRange'

interface AdminPaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (p: number) => void
  /** Appended after the total count, e.g. `"calendar days"` → `… of 12 calendar days`. */
  countLabel?: string
}

export default function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  countLabel,
}: AdminPaginationProps) {
  if (totalItems === 0) return null

  const range = buildPaginationRange(page, totalPages)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col items-stretch gap-4 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-[13px] text-zinc-500 sm:text-left">
        Showing{' '}
        <span className="font-semibold tabular-nums text-zinc-800">{from}</span>
        –
        <span className="font-semibold tabular-nums text-zinc-800">{to}</span>
        {' of '}
        <span className="font-semibold tabular-nums text-zinc-800">
          {totalItems}
        </span>
        {countLabel ? <> {countLabel}</> : null}
      </p>

      <nav
        className="flex flex-wrap items-center justify-center gap-1"
        aria-label="Pagination"
      >
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-link shadow-sm transition hover:border-link/25 hover:bg-primary-soft/14 hover:text-link-hover disabled:pointer-events-none disabled:opacity-35 disabled:hover:border-zinc-200 disabled:hover:bg-white disabled:hover:text-link"
        >
          <Chevron dir="left" />
        </button>

        <div className="flex items-center gap-1 px-1">
          {range.map((item, i) =>
            item === 'ellipsis' ? (
              <span
                key={`e-${i}`}
                className="px-1 text-sm font-bold text-zinc-400"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={`min-w-9 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums transition ${
                  item === page
                    ? 'bg-primary-soft/38 text-link-hover shadow-sm ring-1 ring-primary-soft/55'
                    : 'text-link hover:bg-primary-soft/14 hover:text-link-hover'
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-link shadow-sm transition hover:border-link/25 hover:bg-primary-soft/14 hover:text-link-hover disabled:pointer-events-none disabled:opacity-35 disabled:hover:border-zinc-200 disabled:hover:bg-white disabled:hover:text-link"
        >
          <Chevron dir="right" />
        </button>
      </nav>
    </div>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === 'left' ? 'M14 7l-5 5 5 5' : 'M10 7l5 5-5 5'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
