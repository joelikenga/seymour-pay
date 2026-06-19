import { DISPLAY_TIMEZONE, formatDayStamp, formatDateTime } from './formatters'

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

/** First (0-based) month index of a 1-based quarter: Q1→0, Q2→3, Q3→6, Q4→9. */
export function quarterStartMonthIndex(quarter: number): number {
  return (quarter - 1) * 3
}

/** 1-based quarter (1–4) containing a 0-based month index. */
export function quarterForMonthIndex(monthIndex: number): number {
  return Math.floor(monthIndex / 3) + 1
}

/**
 * All four quarter tiles for one calendar year. A quarter is `disabled` until
 * its full span has elapsed (i.e. the current quarter and any future quarter
 * are incomplete and cannot be selected).
 */
export function quarterOptionsForCalendarYear(
  year: number,
  now: Date = new Date(),
): QuarterOption[] {
  const y = Math.max(TRANSACTION_FILTER_MIN_YEAR, year)
  const out: QuarterOption[] = []
  for (let q = 1; q <= 4; q++) {
    const startMonth = quarterStartMonthIndex(q)
    const end = new Date(y, startMonth + 3, 0, 23, 59, 59, 999)
    const disabled = end.getTime() > now.getTime()
    out.push({ year: y, quarter: q, value: `quarter:${y}-${q}`, label: `Q${q} ${y}`, disabled })
  }
  return out
}

/** Label for a `quarter:YYYY-Q` filter value (trigger / summaries). */
export function labelForQuarterFilterValue(value: string): string | null {
  if (!value.startsWith('quarter:')) return null
  const rest = value.slice('quarter:'.length)
  const [ys, qs] = rest.split('-').map((x) => Number.parseInt(x, 10))
  if (!Number.isFinite(ys) || !Number.isFinite(qs)) return null
  if (ys < TRANSACTION_FILTER_MIN_YEAR) return null
  if (qs < 1 || qs > 4) return null
  return `Q${qs} ${ys}`
}

export type DateFilterSelection =
  | { kind: 'all' }
  | { kind: 'today' }
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: 'month'; year: number; monthIndex: number }
  | { kind: 'quarter'; year: number; quarter: number }
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

/** Local `Date` → API datetime `YYYY-MM-DDTHH:MM:SS`. */
export function dateToLocalApiDatetime(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}:${s}`
}

/** `datetime-local` value or `YYYY-MM-DD` → calendar date for month / quarter APIs. */
export function filterBoundCalendarDate(value: string): string {
  const t = value.trim()
  if (!t) return ''
  return t.includes('T') ? t.slice(0, 10) : t
}

/** `datetime-local` or `YYYY-MM-DD` → API `from` / `to` datetime string. */
export function filterBoundToApiDatetime(
  value: string,
  which: 'start' | 'end',
): string {
  const t = value.trim()
  if (!t) return ''
  if (t.includes('T')) {
    const [datePart, timePart = ''] = t.split('T')
    const parts = timePart.split(':')
    const hh = (parts[0] ?? '00').padStart(2, '0')
    const mm = (parts[1] ?? '00').padStart(2, '0')
    const ss = (parts[2] ?? '00').padStart(2, '0')
    return `${datePart}T${hh}:${mm}:${ss}`
  }
  return which === 'start' ? `${t}T00:00:00` : `${t}T23:59:59`
}

export type TransactionApiDateRange = {
  from?: string
  to?: string
  /** Set for custom ranges (and available for reconciliation cashier APIs). */
  from_datetime?: string
  to_datetime?: string
}

/** Parse `datetime-local` or legacy `YYYY-MM-DD` custom filter values. */
export function parseCustomRangeBound(
  value: string,
  which: 'start' | 'end',
): Date | null {
  const t = value.trim()
  if (!t) return null
  if (t.includes('T')) {
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return null
    return d
  }
  const d = new Date(`${t}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return which === 'start' ? startOfLocalDay(d) : endOfLocalDay(d)
}

/** Trigger label for custom `datetime-local` start/end (admin date filters). */
export function labelForCustomDatetimeRange(start: string, end: string): string {
  if (!start.trim() || !end.trim()) {
    return 'Custom range (set date & time)'
  }
  const display = (v: string) => {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime()) && v.includes('T')) {
      return d.toLocaleString('en-NG', {
        timeZone: DISPLAY_TIMEZONE,
        dateStyle: 'short',
        timeStyle: 'short',
      })
    }
    return v.replace('T', ' ')
  }
  return `${display(start)} → ${display(end)}`
}

/** Summary for the date-filter trigger across admin pages. */
export function labelForTransactionDateFilter(
  filterValue: string,
  customStart: string,
  customEnd: string,
): string {
  if (filterValue === 'all') return 'All time'
  if (filterValue === 'today') return 'Today'
  if (filterValue === '7d') return 'Last 7 days'
  if (filterValue === '30d') return 'Last 30 days'
  if (filterValue === 'custom') {
    return labelForCustomDatetimeRange(customStart, customEnd)
  }
  if (filterValue.startsWith('month:')) {
    return labelForMonthFilterValue(filterValue) ?? 'Month'
  }
  if (filterValue.startsWith('quarter:')) {
    return labelForQuarterFilterValue(filterValue) ?? 'Quarter'
  }
  return 'Month'
}

/**
 * Inclusive range for admin APIs that need precise custom datetimes
 * (e.g. reconciliation cashier endpoints via `from_datetime` / `to_datetime`).
 * Presets and month tiles use calendar `YYYY-MM-DD` for `from` / `to`.
 */
export function dateSelectionToApiRange(
  selection: DateFilterSelection,
  now: Date = new Date(),
): TransactionApiDateRange {
  const bounds = getFilterBounds(selection, now)
  if (!bounds) return {}
  if (selection.kind === 'custom') {
    const fromIso = bounds.start.toISOString()
    const toIso = bounds.end.toISOString()
    return {
      from: toLocalYmd(bounds.start),
      to: toLocalYmd(bounds.end),
      from_datetime: fromIso,
      to_datetime: toIso,
    }
  }
  return { from: toLocalYmd(bounds.start), to: toLocalYmd(bounds.end) }
}

/**
 * Calendar `from` / `to` (`YYYY-MM-DD`) for day-based admin APIs such as
 * `GET /admin/analytics/overview` and `GET /admin/transactions`.
 */
export function dateSelectionToCalendarApiRange(
  selection: DateFilterSelection,
  now: Date = new Date(),
): Pick<TransactionApiDateRange, 'from' | 'to'> {
  const bounds = getFilterBounds(selection, now)
  if (!bounds) return {}
  return { from: toLocalYmd(bounds.start), to: toLocalYmd(bounds.end) }
}

/**
 * Inclusive date-only range for `GET /admin/analytics/overview` — local `from` /
 * `to` calendar dates (e.g. `2026-01-01` … `2026-03-31`), so month / quarter /
 * preset filters keep the picked calendar date.
 * @see dateSelectionToTransactionsApiRange
 */
export const dateSelectionToAnalyticsApiRange = dateSelectionToTransactionsApiRange

/**
 * Inclusive date-only range (`YYYY-MM-DD`) for analytics and other day-based
 * admin APIs — month / quarter presets keep calendar dates, not datetimes.
 */
export function dateSelectionToTransactionsApiRange(
  selection: DateFilterSelection,
  now: Date = new Date(),
): Pick<TransactionApiDateRange, 'from' | 'to'> {
  const bounds = getFilterBounds(selection, now)
  if (!bounds) return {}
  return {
    from: toLocalYmd(bounds.start),
    to: toLocalYmd(bounds.end),
  }
}

/**
 * Readable inclusive bounds for audit logs on CSV export - **from** … **to** …
 * (uses the same calendar range as the API `from` / `to` params).
 */
export function describeDateSelectionForExportLog(
  selection: DateFilterSelection,
  now: Date = new Date(),
): string {
  if (selection.kind === 'custom') {
    const start = parseCustomRangeBound(selection.start, 'start')
    const end = parseCustomRangeBound(selection.end, 'end')
    if (start && end) {
      return `date range: from ${formatDateTime(start.toISOString())} to ${formatDateTime(end.toISOString())}`
    }
  }
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
  if (selection.kind === 'custom') {
    const s = selection.start.trim()
    const e = selection.end.trim()
    if (!s || !e) return 'all'
    return `custom|${s}|${e}`
  }
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
  if (selection.kind === 'quarter') {
    const startMonth = quarterStartMonthIndex(selection.quarter)
    const start = new Date(selection.year, startMonth, 1, 0, 0, 0, 0)
    const end = new Date(
      selection.year,
      startMonth + 3,
      0,
      23,
      59,
      59,
      999,
    )
    return { start, end }
  }
  if (selection.kind === 'custom') {
    const start = parseCustomRangeBound(selection.start, 'start')
    const end = parseCustomRangeBound(selection.end, 'end')
    if (!start || !end) return null
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

export interface QuarterOption {
  year: number
  /** 1-based quarter (1–4). */
  quarter: number
  value: string
  label: string
  /** True until the quarter's full span has elapsed (current/future quarters). */
  disabled: boolean
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
  if (value.startsWith('quarter:')) {
    const rest = value.slice('quarter:'.length)
    const [ys, qs] = rest.split('-').map((x) => Number.parseInt(x, 10))
    if (!Number.isFinite(ys) || !Number.isFinite(qs)) return { kind: 'all' }
    if (qs < 1 || qs > 4) return { kind: 'all' }
    return { kind: 'quarter', year: ys, quarter: qs }
  }
  return { kind: 'all' }
}

