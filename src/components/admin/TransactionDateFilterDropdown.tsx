import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  defaultTransactionFilterYear,
  monthOptionsForCalendarYear,
  TRANSACTION_FILTER_MIN_YEAR,
  transactionFilterYearChoices,
} from '../../lib/transactionDateFilter'

function monthShort(monthIndex: number): string {
  return new Date(2000, monthIndex, 1).toLocaleString(undefined, {
    month: 'short',
  })
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
  const [yearMenuOpen, setYearMenuOpen] = useState(false)
  const [panelYear, setPanelYear] = useState(() => defaultTransactionFilterYear())

  const isMonthFilter = filterValue.startsWith('month:')
  const yearChoices = useMemo(() => transactionFilterYearChoices(), [])
  const monthsForYear = useMemo(
    () => monthOptionsForCalendarYear(panelYear),
    [panelYear],
  )

  useEffect(() => {
    if (open && isMonthFilter) setMonthSectionOpen(true)
  }, [open, isMonthFilter])

  useEffect(() => {
    if (!open) setYearMenuOpen(false)
  }, [open])

  // When opening: focus month grid on the year of the active month filter, else current year.
  useEffect(() => {
    if (!open) return
    if (filterValue.startsWith('month:')) {
      const rest = filterValue.slice('month:'.length)
      const [ys] = rest.split('-').map((x) => Number.parseInt(x, 10))
      if (Number.isFinite(ys) && ys >= TRANSACTION_FILTER_MIN_YEAR) {
        setPanelYear(ys)
        return
      }
    }
    setPanelYear(defaultTransactionFilterYear())
  }, [open, filterValue])

  const closeMenu = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

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

  /** Fullscreen modal on narrow viewports - lock scroll behind the sheet. */
  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => {
      if (mq.matches) {
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
      } else {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [open])

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
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-2.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-primary/30 hover:bg-zinc-50/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
        <>
          <div
            className="fixed inset-0 z-45 bg-zinc-950/45 backdrop-blur-[1px] sm:hidden"
            aria-hidden
            onClick={closeMenu}
          />
          <div
            id={titleId}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="fixed inset-0 z-50 flex max-h-dvh flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:z-40 sm:mt-2 sm:max-h-none sm:w-[min(22rem,calc(100vw-2rem))] sm:max-w-none sm:rounded-2xl sm:border sm:border-zinc-200/90 sm:bg-white sm:pt-0 sm:shadow-[0_24px_60px_-20px_rgba(15,23,42,0.28)] sm:ring-1 sm:ring-zinc-950/5"
          >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-linear-to-r from-white to-zinc-50/80 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
              <button
                type="button"
                onClick={closeMenu}
                className="-ml-1 rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 sm:hidden"
                aria-label="Close date filter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Date range
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {filterValue !== 'all' ? (
                <button
                  type="button"
                  onClick={() => select('all')}
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-link hover:bg-primary-soft/14 hover:text-link-hover"
                >
                  Reset
                </button>
              ) : null}
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={yearMenuOpen}
                  aria-label="Year for month picker"
                  onClick={() => setYearMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white py-1 pl-2 pr-1.5 text-xs font-semibold tabular-nums text-zinc-800 shadow-sm outline-none transition hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <span>{panelYear}</span>
                  <span
                    className={`text-zinc-400 transition ${yearMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
                {yearMenuOpen ? (
                  <div
                    role="listbox"
                    aria-label="Choose year"
                    className="absolute right-0 z-60 mt-1.5 max-h-48 w-24 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-zinc-950/5"
                  >
                    {yearChoices.map((y) => {
                      const active = y === panelYear
                      return (
                        <button
                          key={y}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setPanelYear(y)
                            setYearMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs font-semibold tabular-nums transition ${
                            active
                              ? 'bg-primary-soft/22 text-orange-950'
                              : 'text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {y}
                          {active ? (
                            <span className="text-link" aria-hidden>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:block sm:flex-none">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:max-h-[min(28rem,70vh)] sm:flex-none">
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
                        ? 'bg-primary-soft/22 text-orange-950 ring-1 ring-primary-soft/45'
                        : 'text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    {p.label}
                    {active ? (
                      <span className="text-link" aria-hidden>
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

            {monthsForYear.length > 0 ? (
              <>
                <div className="my-2 h-px bg-zinc-100" />
                <button
                  type="button"
                  onClick={() => setMonthSectionOpen((s) => !s)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left transition hover:bg-zinc-50"
                  aria-expanded={monthSectionOpen}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    By month ({panelYear})
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
                  <div className="mt-1.5 px-1 pb-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {monthsForYear.map((m) => {
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
                                ? 'border-primary/50 bg-linear-to-b from-primary-soft/28 to-primary-soft/10 text-orange-900 shadow-sm ring-2 ring-primary-soft/30'
                                : 'border-zinc-200/90 bg-zinc-50/70 text-zinc-700 hover:border-primary/30 hover:bg-white hover:text-zinc-900'
                            }`}
                          >
                            {monthShort(m.monthIndex)}
                          </button>
                        )
                      })}
                    </div>
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
                  ? 'bg-primary-soft/22 text-orange-950 ring-1 ring-primary-soft/45'
                  : 'text-zinc-800 hover:bg-zinc-50'
              }`}
            >
              Custom range…
              {filterValue === 'custom' ? (
                <span className="text-link" aria-hidden>
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
          </div>

          {filterValue === 'custom' ? (
            <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Start
                  </span>
                  <input
                    type="date"
                    min={`${TRANSACTION_FILTER_MIN_YEAR}-01-01`}
                    value={customStart}
                    onChange={(e) => onCustomStartChange(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    End
                  </span>
                  <input
                    type="date"
                    min={`${TRANSACTION_FILTER_MIN_YEAR}-01-01`}
                    value={customEnd}
                    onChange={(e) => onCustomEndChange(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
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
        </>
      ) : null}
    </div>
  )
}
