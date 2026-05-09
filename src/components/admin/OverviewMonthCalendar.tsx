import { useMemo } from 'react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function localYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMonthCells(
  year: number,
  monthIndex: number,
): { day: number | null; ymd: string | null }[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const first = new Date(year, monthIndex, 1)
  const lead = (first.getDay() + 6) % 7
  const cells: { day: number | null; ymd: string | null }[] = []
  for (let i = 0; i < lead; i++) cells.push({ day: null, ymd: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(monthIndex + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push({ day: d, ymd: `${year}-${mm}-${dd}` })
  }
  while (cells.length < 42) cells.push({ day: null, ymd: null })
  return cells.slice(0, 42)
}

/** Current-month calendar (local dates only). */
export default function OverviewMonthCalendar() {
  const { monthLabel, cells, todayStr } = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const monthIndex = now.getMonth()
    const todayStr = localYmd(now)
    const monthLabel = now.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    })
    const cells = buildMonthCells(year, monthIndex)
    return { monthLabel, cells, todayStr }
  }, [])

  return (
    <div
      className="relative overflow-hidden rounded-[1.35rem] border border-zinc-200/90 bg-linear-to-b from-white via-orange-50/25 to-zinc-50/90 p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.18)] ring-1 ring-zinc-950/[0.04]"
      role="region"
      aria-label={`Calendar, ${monthLabel}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-200/70 to-transparent"
        aria-hidden
      />

      <p className="relative mb-4 text-center text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
        {monthLabel}
      </p>

      <div
        className="grid grid-cols-7 gap-1 border-b border-zinc-100 pb-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400"
        aria-hidden
      >
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div
        className="relative mt-3 grid grid-cols-7 gap-1.5"
        role="grid"
        aria-label={`Calendar for ${monthLabel}`}
      >
        {cells.map((cell, i) => {
          const col = i % 7
          const isWeekend = col >= 5

          if (cell.day == null || cell.ymd == null) {
            return (
              <div
                key={`e-${i}`}
                className={`aspect-square min-h-[2.25rem] rounded-xl ${isWeekend ? 'bg-zinc-50/60' : ''}`}
              />
            )
          }

          const isToday = cell.ymd === todayStr
          const isFuture = cell.ymd > todayStr

          let cellClasses =
            'flex aspect-square min-h-[2.25rem] items-center justify-center rounded-xl text-sm tabular-nums transition-colors duration-150 '

          if (isToday) {
            cellClasses +=
              'bg-linear-to-br from-orange-500 to-orange-600 font-semibold text-white shadow-md shadow-orange-500/25 ring-2 ring-white ring-offset-2 ring-offset-orange-50/80 '
          } else if (isFuture) {
            cellClasses += 'text-zinc-300 '
          } else {
            cellClasses += 'text-zinc-800 hover:bg-white/90 hover:shadow-sm '
            if (isWeekend) cellClasses += 'bg-zinc-50/80 '
            else cellClasses += 'bg-white/40 hover:bg-orange-50/60 '
          }

          return (
            <div key={cell.ymd} role="gridcell" className={cellClasses.trim()}>
              {cell.day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
