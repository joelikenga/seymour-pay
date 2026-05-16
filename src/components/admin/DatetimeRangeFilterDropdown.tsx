import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { labelForDatetimeFilter } from '../../lib/datetimeRangeFilter'

const PRESETS: { value: string; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

interface DatetimeRangeFilterDropdownProps {
  filterValue: string
  onFilterChange: (value: string) => void
  customStart: string
  customEnd: string
  onCustomStartChange: (v: string) => void
  onCustomEndChange: (v: string) => void
  triggerLabel?: string
  ariaLabel?: string
}

export default function DatetimeRangeFilterDropdown({
  filterValue,
  onFilterChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  triggerLabel,
  ariaLabel = 'Date and time range',
}: DatetimeRangeFilterDropdownProps) {
  const titleId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  const label =
    triggerLabel ??
    labelForDatetimeFilter(filterValue, customStart, customEnd)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/40"
      >
        <CalendarIcon />
        <span className="truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5"
        >
          <p
            id={titleId}
            className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
          >
            Date & time
          </p>
          <ul className="mt-2 space-y-0.5">
            {PRESETS.map((p) => (
              <li key={p.value}>
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange(p.value)
                    if (p.value !== 'custom') close()
                  }}
                  className={`flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    filterValue === p.value
                      ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-200/80'
                      : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>

          {filterValue === 'custom' ? (
            <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
              <label className="block text-xs font-medium text-zinc-600">
                From
                <input
                  type="datetime-local"
                  step={1}
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm text-zinc-900"
                />
              </label>
              <label className="block text-xs font-medium text-zinc-600">
                To
                <input
                  type="datetime-local"
                  step={1}
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm text-zinc-900"
                />
              </label>
              <button
                type="button"
                onClick={close}
                className="w-full rounded-xl bg-zinc-950 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Done
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-orange-700"
      aria-hidden
    >
      <path
        d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
