import { useCallback, useMemo, useState } from 'react'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export interface CustomDateRangePickerProps {
  initialStart?: string
  initialEnd?: string
  onApply: (start: string, end: string) => void
  onCancel?: () => void
  onReset?: () => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseYmdOrDatetime(
  val: string,
  defaultTime: string,
): { ymd: string; time: string } {
  const t = val?.trim() ?? ''
  if (!t) return { ymd: '', time: defaultTime }
  if (t.includes('T')) {
    const [d, rawTime = ''] = t.split('T')
    const timeParts = rawTime.split(':')
    const hh = pad(Number.parseInt(timeParts[0] ?? '0', 10) || 0)
    const mm = pad(Number.parseInt(timeParts[1] ?? '0', 10) || 0)
    const ss = pad(Number.parseInt(timeParts[2] ?? '0', 10) || 0)
    return { ymd: d, time: `${hh}:${mm}:${ss}` }
  }
  return { ymd: t, time: defaultTime }
}

function displayDateLabel(ymd: string): string {
  if (!ymd) return 'Pick a date'
  const [y, m, d] = ymd.split('-').map((x) => Number.parseInt(x, 10))
  if (!y || !m || !d) return ymd
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function countDaysBetween(startYmd: string, endYmd: string): number | null {
  if (!startYmd || !endYmd) return null
  const [y1, m1, d1] = startYmd.split('-').map((x) => Number.parseInt(x, 10))
  const [y2, m2, d2] = endYmd.split('-').map((x) => Number.parseInt(x, 10))
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null
  const dt1 = new Date(y1, m1 - 1, d1).getTime()
  const dt2 = new Date(y2, m2 - 1, d2).getTime()
  const diff = Math.round(Math.abs(dt2 - dt1) / (1000 * 60 * 60 * 24))
  return diff + 1
}

export default function CustomDateRangePicker({
  initialStart = '',
  initialEnd = '',
  onApply,
  onCancel,
  onReset,
}: CustomDateRangePickerProps) {
  const parsedStart = useMemo(
    () => parseYmdOrDatetime(initialStart, '00:00:00'),
    [initialStart],
  )
  const parsedEnd = useMemo(
    () => parseYmdOrDatetime(initialEnd, '23:59:59'),
    [initialEnd],
  )

  const [startYmd, setStartYmd] = useState(parsedStart.ymd)
  const [startTime, setStartTime] = useState(parsedStart.time)
  const [endYmd, setEndYmd] = useState(parsedEnd.ymd)
  const [endTime, setEndTime] = useState(parsedEnd.time)

  // Which bound is being picked on the calendar: 'from' or 'to'
  const [activeTarget, setActiveTarget] = useState<'from' | 'to'>('from')
  const [showTimeOptions, setShowTimeOptions] = useState(false)

  // Calendar month & year currently viewed
  const [viewYear, setViewYear] = useState(() => {
    if (parsedStart.ymd) {
      const y = Number.parseInt(parsedStart.ymd.split('-')[0], 10)
      if (Number.isFinite(y)) return y
    }
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (parsedStart.ymd) {
      const m = Number.parseInt(parsedStart.ymd.split('-')[1], 10)
      if (Number.isFinite(m)) return m - 1
    }
    return new Date().getMonth()
  })

  const [hoverYmd, setHoverYmd] = useState<string | null>(null)

  const todayStr = useMemo(() => formatLocalDate(new Date()), [])

  const daysCount = useMemo(
    () => countDaysBetween(startYmd, endYmd),
    [startYmd, endYmd],
  )

  // Validation
  const validationError = useMemo(() => {
    if (!startYmd || !endYmd) return null
    const s = `${startYmd}T${startTime}`
    const e = `${endYmd}T${endTime}`
    if (s > e) {
      return 'Start date & time cannot be later than end date & time.'
    }
    return null
  }, [startYmd, startTime, endYmd, endTime])

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const first = new Date(viewYear, viewMonth, 1)
    const lead = (first.getDay() + 6) % 7 // Monday = 0
    const cells: { day: number | null; ymd: string | null }[] = []

    for (let i = 0; i < lead; i++) cells.push({ day: null, ymd: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`
      cells.push({ day: d, ymd })
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, ymd: null })
    return cells
  }, [viewYear, viewMonth])

  const prevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
  }, [])

  function handleDayClick(ymd: string) {
    if (activeTarget === 'from') {
      setStartYmd(ymd)
      // If end is before this new start, adjust end to be same day or clear it
      if (endYmd && ymd > endYmd) {
        setEndYmd(ymd)
      }
      // Auto-advance target to 'to'
      setActiveTarget('to')
    } else {
      // If selected end is before start, make it the new start
      if (startYmd && ymd < startYmd) {
        setStartYmd(ymd)
        setActiveTarget('to')
      } else {
        setEndYmd(ymd)
      }
    }
  }

  function handleSwap() {
    const tempYmd = startYmd
    const tempTime = startTime
    setStartYmd(endYmd)
    setStartTime(endTime)
    setEndYmd(tempYmd)
    setEndTime(tempTime)
  }

  function handleApply() {
    if (!startYmd || !endYmd) return
    const s = `${startYmd}T${startTime || '00:00:00'}`
    const e = `${endYmd}T${endTime || '23:59:59'}`
    if (s > e) return
    onApply(s, e)
  }

  return (
    <div className="flex flex-col text-zinc-900">

      {/* From and To Selection Cards */}
      <div className="grid grid-cols-2 gap-2 border-b border-zinc-100 p-3 sm:gap-3">
        {/* FROM Card */}
        <button
          type="button"
          onClick={() => {
            setActiveTarget('from')
            if (startYmd) {
              const [y, m] = startYmd.split('-').map(Number)
              if (y && m) {
                setViewYear(y)
                setViewMonth(m - 1)
              }
            }
          }}
          className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
            activeTarget === 'from'
              ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-400/30'
              : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                activeTarget === 'from'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              From
            </span>
            <span className="font-mono text-[10px] font-medium text-zinc-500">
              {startTime || '00:00:00'}
            </span>
          </div>
          <span className="mt-1.5 truncate text-xs font-bold text-zinc-900">
            {displayDateLabel(startYmd)}
          </span>
          <span className="text-[10px] text-zinc-400">
            {activeTarget === 'from' ? 'Picking start…' : 'Click to edit'}
          </span>
        </button>

        {/* TO Card */}
        <button
          type="button"
          onClick={() => {
            setActiveTarget('to')
            if (endYmd) {
              const [y, m] = endYmd.split('-').map(Number)
              if (y && m) {
                setViewYear(y)
                setViewMonth(m - 1)
              }
            }
          }}
          className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
            activeTarget === 'to'
              ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-400/30'
              : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                activeTarget === 'to'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              To
            </span>
            <span className="font-mono text-[10px] font-medium text-zinc-500">
              {endTime || '23:59:59'}
            </span>
          </div>
          <span className="mt-1.5 truncate text-xs font-bold text-zinc-900">
            {displayDateLabel(endYmd)}
          </span>
          <span className="text-[10px] text-zinc-400">
            {activeTarget === 'to' ? 'Picking end…' : 'Click to edit'}
          </span>
        </button>
      </div>

      {/* Calendar Month Header & Navigation */}
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            {daysCount != null && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-900">
                {daysCount} {daysCount === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 border-b border-zinc-100 pb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-0.5">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="mt-1.5 grid grid-cols-7 gap-y-1">
          {calendarDays.map((cell, idx) => {
            if (!cell.day || !cell.ymd) {
              return <div key={`empty-${idx}`} className="h-7 w-full" />
            }

            const ymd = cell.ymd
            const isStart = ymd === startYmd
            const isEnd = ymd === endYmd
            const isSameDay = isStart && isEnd
            const inRange =
              Boolean(startYmd && endYmd) &&
              ymd > startYmd &&
              ymd < endYmd
            const inHoverRange =
              activeTarget === 'to' &&
              startYmd &&
              !endYmd &&
              hoverYmd &&
              ymd > startYmd &&
              ymd <= hoverYmd

            const isToday = ymd === todayStr

            let cellClass =
              'relative flex h-7.5 w-full items-center justify-center text-xs font-semibold tabular-nums transition '

            if (isSameDay) {
              cellClass +=
                ' rounded-full bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-sm ring-2 ring-orange-300 font-bold z-10'
            } else if (isStart) {
              cellClass +=
                ' rounded-l-full bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-sm font-bold z-10'
            } else if (isEnd) {
              cellClass +=
                ' rounded-r-full bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-sm font-bold z-10'
            } else if (inRange || inHoverRange) {
              cellClass += ' bg-orange-100 text-orange-950 font-bold'
            } else {
              cellClass +=
                ' rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
            }

            return (
              <div
                key={ymd}
                className="relative flex items-center justify-center p-0.5"
                onMouseEnter={() => setHoverYmd(ymd)}
                onMouseLeave={() => setHoverYmd(null)}
              >
                <button
                  type="button"
                  onClick={() => handleDayClick(ymd)}
                  className={cellClass.trim()}
                  title={ymd}
                >
                  {cell.day}
                  {isToday && !isStart && !isEnd && (
                    <span
                      className="absolute bottom-1 h-1 w-1 rounded-full bg-orange-500"
                      aria-hidden
                    />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Time Controls Toggle */}
      <div className="mt-2 border-t border-zinc-100 px-3 pt-2">
        <button
          type="button"
          onClick={() => setShowTimeOptions((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
        >
          <span className="flex items-center gap-1.5">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              className="text-zinc-400"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 7v5l3 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Fine-tune times: <span className="font-mono text-zinc-800">{startTime}</span> → <span className="font-mono text-zinc-800">{endTime}</span>
          </span>
          <span className="text-[10px] text-orange-700 font-bold">
            {showTimeOptions ? 'Hide' : 'Edit times'}
          </span>
        </button>

        {showTimeOptions && (
          <div className="mt-2 space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Start time
                </span>
                <input
                  type="time"
                  step={1}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                <div className="flex gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setStartTime('00:00:00')}
                    className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 shadow-2xs border border-zinc-200/80 hover:bg-orange-50 hover:text-orange-950"
                  >
                    00:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartTime('12:00:00')}
                    className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 shadow-2xs border border-zinc-200/80 hover:bg-orange-50 hover:text-orange-950"
                  >
                    12:00
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  End time
                </span>
                <input
                  type="time"
                  step={1}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                <div className="flex gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setEndTime('23:59:59')}
                    className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 shadow-2xs border border-zinc-200/80 hover:bg-orange-50 hover:text-orange-950"
                  >
                    23:59
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndTime('12:00:00')}
                    className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 shadow-2xs border border-zinc-200/80 hover:bg-orange-50 hover:text-orange-950"
                  >
                    12:00
                  </button>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Validation banner if invalid */}
      {validationError && (
        <div className="mx-3 mt-2.5 flex items-center justify-between rounded-lg bg-rose-50 p-2 text-xs text-rose-800">
          <span>{validationError}</span>
          <button
            type="button"
            onClick={handleSwap}
            className="ml-2 underline font-semibold hover:text-rose-950"
          >
            Swap
          </button>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/70 p-3">
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
            >
              Reset
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
            >
              Cancel
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={!startYmd || !endYmd || Boolean(validationError)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Filter
        </button>
      </div>
    </div>
  )
}
