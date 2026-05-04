import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MonthOption } from '../../lib/transactionDateFilter'

function monthShort(monthIndex: number): string {
  return new Date(2000, monthIndex, 1).toLocaleString(undefined, {
    month: 'short',
  })
}

function groupMonthsByYear(options: MonthOption[]): [number, MonthOption[]][] {
  const map = new Map<number, MonthOption[]>()
  for (const o of options) {
    if (!map.has(o.year)) map.set(o.year, [])
    map.get(o.year)!.push(o)
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.monthIndex - b.monthIndex)
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0])
}

const PRESETS: { value: string; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

interface TransactionDateFilterDropdownProps {
  filterValue: string
  onFilterChange: (value: string) => void
  monthOptions: MonthOption[]
  triggerLabel: string
  customStart: string
  customEnd: string
  onCustomStartChange: (v: string) => void
  onCustomEndChange: (v: string) => void
}

export default function TransactionDateFilterDropdown({
  filterValue,
  onFilterChange,
  monthOptions,
  triggerLabel,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: TransactionDateFilterDropdownProps) {
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [monthSectionOpen, setMonthSectionOpen] = useState(true)

  const isMonthFilter = filterValue.startsWith('month:')
  const byYear = useMemo(
    () => groupMonthsByYear(monthOptions),
    [monthOptions],
  )

  useEffect(() => {
    if (open && isMonthFilter) setMonthSectionOpen(true)
  }, [open, isMonthFilter])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function select(value: string) {
    onFilterChange(value)
    if (value !== 'custom') setOpen(false)
  }

  const modal = open ? (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onClick={() => setOpen(false)}
    >
      <div
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-md transition-opacity"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(88vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_32px_120px_-24px_rgba(15,23,42,0.35)] ring-1 ring-zinc-950/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-zinc-950">
              Date range
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Filter charts and tables by posting period.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <div className="space-y-0.5">
            {PRESETS.map((p) => {
              const active = filterValue === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => select(p.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-200/80'
                      : 'text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  {p.label}
                  {active ? (
                    <span className="text-orange-600" aria-hidden>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12.5l4.5 4.5L19 6.5"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="my-3 h-px bg-linear-to-r from-transparent via-zinc-200 to-transparent" />

          <div>
            <button
              type="button"
              onClick={() => setMonthSectionOpen((s) => !s)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left"
              aria-expanded={monthSectionOpen}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                By month
              </span>
              <span
                className={`text-zinc-400 transition ${monthSectionOpen ? 'rotate-180' : ''}`}
                aria-hidden
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {monthSectionOpen ? (
              <div className="mt-2 space-y-4 px-0.5 pb-2">
                {byYear.map(([year, months]) => (
                  <div key={year}>
                    <p className="mb-2.5 pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {year}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {months.map((m) => {
                        const active = filterValue === m.value
                        return (
                          <button
                            key={m.value}
                            type="button"
                            role="option"
                            title={m.label}
                            aria-selected={active}
                            onClick={() => select(m.value)}
                            className={`flex aspect-square min-h-0 min-w-0 items-center justify-center rounded-lg border text-center transition active:scale-[0.98] ${
                              active
                                ? 'border-[#ea580c] bg-linear-to-b from-orange-50 to-amber-50/80 text-orange-900 shadow-sm ring-2 ring-orange-500/20'
                                : 'border-zinc-200/90 bg-zinc-50/80 text-zinc-800 hover:border-orange-200/80 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            <span className="px-0.5 text-xs font-bold leading-tight sm:text-[13px]">
                              {monthShort(m.monthIndex)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="my-3 h-px bg-linear-to-r from-transparent via-zinc-200 to-transparent" />

          <button
            type="button"
            role="option"
            aria-selected={filterValue === 'custom'}
            onClick={() => onFilterChange('custom')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              filterValue === 'custom'
                ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-200/80'
                : 'text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            Custom range…
            {filterValue === 'custom' ? (
              <span className="text-orange-600" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5l4.5 4.5L19 6.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : null}
          </button>
        </div>

        {filterValue === 'custom' ? (
          <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/90 px-5 py-4">
            <p className="text-xs font-medium text-zinc-600">Custom period</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Start date
                </span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-500/15"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  End date
                </span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-500/15"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
    </div>
  ) : null

  return (
    <div className="relative w-full min-w-0 sm:max-w-[280px]">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Date range
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white py-2.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-orange-200/90 hover:bg-zinc-50/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/20"
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <span className="shrink-0 text-zinc-400" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {typeof document !== 'undefined' && modal
        ? createPortal(modal, document.body)
        : null}
    </div>
  )
}
