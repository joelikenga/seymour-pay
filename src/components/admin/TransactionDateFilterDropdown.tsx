import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
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
  /** Optional accessible label override for the trigger button. */
  ariaLabel?: string
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
  ariaLabel = 'Date range',
}: TransactionDateFilterDropdownProps) {
  const titleId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
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

  const closeMenu = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  // Outside click + escape close
  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null
      if (!target) return
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeMenu()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeMenu])

  function select(value: string) {
    onFilterChange(value)
    if (value !== 'custom') closeMenu()
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-2.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-orange-200/90 hover:bg-zinc-50/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/20"
      >
        <span className="text-zinc-400" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="max-w-40 truncate">{triggerLabel}</span>
        <span
          className={`text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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

      {open ? (
        <div
          id={titleId}
          role="dialog"
          aria-label={ariaLabel}
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.28)] ring-1 ring-zinc-950/5"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 bg-linear-to-r from-white to-zinc-50/80 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Date range
            </p>
            {filterValue !== 'all' ? (
              <button
                type="button"
                onClick={() => select('all')}
                className="text-[11px] font-semibold text-orange-700 hover:text-orange-800"
              >
                Reset
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(28rem,70vh)] overflow-y-auto overscroll-contain p-2">
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
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      active
                        ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-200/80'
                        : 'text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    {p.label}
                    {active ? (
                      <span className="text-orange-600" aria-hidden>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
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

            {byYear.length > 0 ? (
              <>
                <div className="my-2 h-px bg-zinc-100" />
                <button
                  type="button"
                  onClick={() => setMonthSectionOpen((s) => !s)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left transition hover:bg-zinc-50"
                  aria-expanded={monthSectionOpen}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    By month
                  </span>
                  <span
                    className={`text-zinc-400 transition ${monthSectionOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
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
                  <div className="mt-1.5 space-y-3 px-1 pb-1">
                    {byYear.map(([year, months]) => (
                      <div key={year}>
                        <p className="mb-1.5 pl-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {year}
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
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
                                className={`rounded-lg border py-1.5 text-center text-[11px] font-bold transition active:scale-[0.98] ${
                                  active
                                    ? 'border-orange-300 bg-linear-to-b from-orange-50 to-amber-50/80 text-orange-900 shadow-sm ring-2 ring-orange-500/20'
                                    : 'border-zinc-200/90 bg-zinc-50/70 text-zinc-700 hover:border-orange-200/80 hover:bg-white hover:text-zinc-900'
                                }`}
                              >
                                {monthShort(m.monthIndex)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="my-2 h-px bg-zinc-100" />

            <button
              type="button"
              role="option"
              aria-selected={filterValue === 'custom'}
              onClick={() => onFilterChange('custom')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                filterValue === 'custom'
                  ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-200/80'
                  : 'text-zinc-800 hover:bg-zinc-50'
              }`}
            >
              Custom range…
              {filterValue === 'custom' ? (
                <span className="text-orange-600" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
            <div className="border-t border-zinc-100 bg-zinc-50/80 px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Start
                  </span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => onCustomStartChange(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-500/15"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    End
                  </span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => onCustomEndChange(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-500/15"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="mt-3 w-full rounded-xl bg-zinc-950 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-zinc-800"
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
