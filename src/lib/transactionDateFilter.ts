import { formatDayStamp } from './formatters'

/** Earliest year offered in admin date filters (year dropdown + month tiles). */
export const TRANSACTION_FILTER_MIN_YEAR = 2026

export function defaultTransactionFilterYear(now: Date = new Date()): number {
  return Math.max(TRANSACTION_FILTER_MIN_YEAR, now.getFullYear())
}

/** Years from {@link TRANSACTION_FILTER_MIN_YEAR} through the current calendar year. */
export function transactionFilterYearChoices(now: Date = new Date()): number[] {
  const end = defaultTransactionFilterYear(now)
  const out: number[] = []
  for (let y = TRANSACTION_FILTER_MIN_YEAR; y <= end; y++) {
    out.push(y)
  }
  return out
}

/**
 * Month tiles for one calendar year: January through December, or January through
 * the current month when `year` is the current year (same rule as overview pickers).
 */
export function monthOptionsForCalendarYear(
  year: number,
  now: Date = new Date(),
): MonthOption[] {
  const y = Math.max(TRANSACTION_FILTER_MIN_YEAR, year)
  const nowY = now.getFullYear()
  const nowM = now.getMonth()
  if (y > nowY) return []
  const endMonth = y === nowY ? nowM : 11
  const out: MonthOption[] = []
  for (let m = 0; m <= endMonth; m++) {
    const value = `month:${y}-${String(m + 1).padStart(2, '0')}`
    const label = new Date(y, m, 15).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    })
    out.push({ year: y, monthIndex: m, value, label })
  }
  return out
}

/** Label for a `month:YYYY-MM` filter value (trigger / summaries). */
export function labelForMonthFilterValue(value: string): string | null {
  if (!value.startsWith('month:')) return null
  const rest = value.slice('month:'.length)
  const [ys, ms] = rest.split('-').map((x) => Number.parseInt(x, 10))
  if (!Number.isFinite(ys) || !Number.isFinite(ms)) return null
  if (ys < TRANSACTION_FILTER_MIN_YEAR) return null
  const d = new Date(ys, ms - 1, 15)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

export type DateFilterSelection =
  | { kind: 'all' }
  | { kind: 'today' }
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: 'month'; year: number; monthIndex: number }
  | { kind: 'custom'; start: string; end: string }

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Local calendar `YYYY-MM-DD` (matches filter UI / server date params). */
export function toLocalYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Inclusive `from` / `to` strings for `GET /admin/transactions` when not “all time”. */
export function dateSelectionToApiRange(
  selection: DateFilterSelection,
  now: Date = new Date(),
): { from?: string; to?: string } {
  const bounds = getFilterBounds(selection, now)
  if (!bounds) return {}
  return { from: toLocalYmd(bounds.start), to: toLocalYmd(bounds.end) }
}

/**
 * Readable inclusive bounds for audit logs on CSV export - **from** … **to** …
 * (uses the same calendar range as the API `from` / `to` params).
 */
export function describeDateSelectionForExportLog(
  selection: DateFilterSelection,
  now: Date = new Date(),
): string {
  const { from, to } = dateSelectionToApiRange(selection, now)
  if (!from || !to) {
    return 'date range: all dates'
  }
  return `date range: from ${formatDayStamp(from)} to ${formatDayStamp(to)}`
}

/** Stable segment for TanStack `queryKey` (e.g. `all` or `2026-05-01|2026-05-10`). */
export function dateSelectionToQueryKey(
  selection: DateFilterSelection,
  now: Date = new Date(),
): string {
  const { from, to } = dateSelectionToApiRange(selection, now)
  if (!from || !to) return 'all'
  return `${from}|${to}`
}

export function getFilterBounds(
  selection: DateFilterSelection,
  now: Date = new Date(),
): { start: Date; end: Date } | null {
  if (selection.kind === 'all') return null
  if (selection.kind === 'today') {
    return { start: startOfLocalDay(now), end: endOfLocalDay(now) }
  }
  if (selection.kind === '7d') {
    const end = endOfLocalDay(now)
    const start = startOfLocalDay(now)
    start.setDate(start.getDate() - 6)
    return { start, end }
  }
  if (selection.kind === '30d') {
    const end = endOfLocalDay(now)
    const start = startOfLocalDay(now)
    start.setDate(start.getDate() - 29)
    return { start, end }
  }
  if (selection.kind === 'month') {
    const start = new Date(
      selection.year,
      selection.monthIndex,
      1,
      0,
      0,
      0,
      0,
    )
    const end = new Date(
      selection.year,
      selection.monthIndex + 1,
      0,
      23,
      59,
      59,
      999,
    )
    return { start, end }
  }
  if (selection.kind === 'custom') {
    const start = startOfLocalDay(new Date(`${selection.start}T12:00:00`))
    const end = endOfLocalDay(new Date(`${selection.end}T12:00:00`))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
    if (start.getTime() > end.getTime()) return { start: end, end: start }
    return { start, end }
  }
  return null
}

export function transactionInRange(
  createdAt: string,
  bounds: { start: Date; end: Date },
): boolean {
  const t = new Date(createdAt).getTime()
  return t >= bounds.start.getTime() && t <= bounds.end.getTime()
}

export function filterRowsByDateSelection<T extends { createdAt: string }>(
  rows: T[],
  selection: DateFilterSelection,
  now?: Date,
): T[] {
  const bounds = getFilterBounds(selection, now)
  if (!bounds) return rows
  return rows.filter((r) => transactionInRange(r.createdAt, bounds))
}

export interface MonthOption {
  year: number
  monthIndex: number
  value: string
  label: string
}

/**
 * Calendar months from **January** of the earliest relevant year through the
 * current month (inclusive). Each full past year includes Jan–Dec; the current
 * year stops at the present month - matches month-picker grids (Jan → now).
 */
export function monthsThroughCurrent(
  earliestTransaction: Date | null,
  now: Date = new Date(),
): MonthOption[] {
  const endY = now.getFullYear()
  const endM = now.getMonth()
  let startY = endY
  if (earliestTransaction) {
    startY = earliestTransaction.getFullYear()
  }
  if (startY > endY) {
    startY = endY
  }

  const out: MonthOption[] = []
  for (let y = startY; y <= endY; y++) {
    const endMonth = y === endY ? endM : 11
    for (let m = 0; m <= endMonth; m++) {
      const value = `month:${y}-${String(m + 1).padStart(2, '0')}`
      const label = new Date(y, m, 15).toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
      })
      out.push({ year: y, monthIndex: m, value, label })
    }
  }

  if (out.length === 0) {
    const value = `month:${endY}-${String(endM + 1).padStart(2, '0')}`
    const label = new Date(endY, endM, 15).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    })
    out.push({ year: endY, monthIndex: endM, value, label })
  }
  return out
}

export function parseFilterValue(
  value: string,
  customStart: string,
  customEnd: string,
): DateFilterSelection {
  if (value === 'all') return { kind: 'all' }
  if (value === 'today') return { kind: 'today' }
  if (value === '7d') return { kind: '7d' }
  if (value === '30d') return { kind: '30d' }
  if (value === 'custom')
    return { kind: 'custom', start: customStart, end: customEnd }
  if (value.startsWith('month:')) {
    const rest = value.slice('month:'.length)
    const [ys, ms] = rest.split('-').map((x) => Number.parseInt(x, 10))
    if (!Number.isFinite(ys) || !Number.isFinite(ms)) return { kind: 'all' }
    return { kind: 'month', year: ys, monthIndex: ms - 1 }
  }
  return { kind: 'all' }
}

export function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function transactionsToCsv(
  rows: Array<{
    reference: string
    customerName: string
    vehicleType: string
    channel: string
    amount: number
    status: string
    createdAt: string
    notes: string
  }>,
): string {
  const header =
    'reference,customer,vehicle_type,payment_type,amount,status,date,notes'
  const lines = rows.map((t) =>
    [
      escapeCsvCell(t.reference),
      escapeCsvCell(t.customerName),
      escapeCsvCell(t.vehicleType),
      escapeCsvCell(t.channel),
      String(t.amount),
      escapeCsvCell(t.status),
      escapeCsvCell(t.createdAt),
      escapeCsvCell(t.notes ?? ''),
    ].join(','),
  )
  return '\uFEFF' + header + '\n' + lines.join('\n')
}
