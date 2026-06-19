import {
  dateSelectionToQueryKey,
  dateSelectionToTransactionsApiRange,
  dateToLocalApiDatetime,
  filterBoundCalendarDate,
  labelForCustomDatetimeRange,
  labelForTransactionDateFilter,
  parseCustomRangeBound,
  type DateFilterSelection,
} from './transactionDateFilter'

/**
 * Optional From / To filter values (`datetime-local` in the UI).
 * Month and quarter presets stay calendar `YYYY-MM-DD` via
 * {@link dateSelectionToTransactionsApiRange}.
 */
export type TransactionCustomDateBounds = {
  from: string
  to: string
}

export function transactionCustomDateQueryKey(
  bounds: TransactionCustomDateBounds,
): string {
  const from = bounds.from.trim()
  const to = bounds.to.trim()
  if (!from && !to) return ''
  return `${from}|${to}`
}

/**
 * Calendar `YYYY-MM-DD` bounds for month / quarter (and analytics APIs).
 * Custom From / To datetimes are clamped to the date portion only.
 */
export function resolveTransactionsListApiRange(
  dateSelection: DateFilterSelection,
  customDates: TransactionCustomDateBounds,
): { from?: string; to?: string } {
  const base = dateSelectionToTransactionsApiRange(dateSelection)
  if (!base.from || !base.to) return base

  const customFrom = filterBoundCalendarDate(customDates.from)
  const customTo = filterBoundCalendarDate(customDates.to)
  if (!customFrom || !customTo) return base

  const from = customFrom > base.from ? customFrom : base.from
  const to = customTo < base.to ? customTo : base.to
  if (from > to) return { from, to: from }
  return { from, to }
}

/**
 * API `from` / `to` for ledger list, export, and cashiers.
 * Month / quarter only → `YYYY-MM-DD` (e.g. `2026-02-01`).
 * Custom From / To set → `YYYY-MM-DDTHH:MM:SS` (e.g. `2026-02-28T23:59:59`).
 */
export function resolveTransactionsListApiDatetimeRange(
  dateSelection: DateFilterSelection,
  customDates: TransactionCustomDateBounds,
): { from?: string; to?: string } {
  const base = dateSelectionToTransactionsApiRange(dateSelection)
  if (!base.from || !base.to) return {}

  const customFrom = customDates.from.trim()
  const customTo = customDates.to.trim()

  if (!customFrom || !customTo) {
    return { from: base.from, to: base.to }
  }

  const presetStart = parseCustomRangeBound(base.from, 'start')
  const presetEnd = parseCustomRangeBound(base.to, 'end')
  const start = parseCustomRangeBound(customFrom, 'start')
  const end = parseCustomRangeBound(customTo, 'end')
  if (!presetStart || !presetEnd || !start || !end) return {}

  const clampedStart = start < presetStart ? presetStart : start
  const clampedEnd = end > presetEnd ? presetEnd : end
  if (clampedStart.getTime() > clampedEnd.getTime()) {
    const from = dateToLocalApiDatetime(clampedStart)
    return { from, to: from }
  }

  return {
    from: dateToLocalApiDatetime(clampedStart),
    to: dateToLocalApiDatetime(clampedEnd),
  }
}

/** @deprecated Use {@link resolveTransactionsListApiDatetimeRange}. */
export const resolveCashiersApiRange = resolveTransactionsListApiDatetimeRange

/** Stable key for cashier list cache / reset when the ledger date range changes. */
export function cashiersApiRangeKey(range: {
  from?: string
  to?: string
}): string {
  const from = range.from?.trim() ?? ''
  const to = range.to?.trim() ?? ''
  if (!from || !to) return ''
  return `${from}|${to}`
}

export function transactionsListFiltersQueryKey(
  dateSelection: DateFilterSelection,
  customDates: TransactionCustomDateBounds,
  cashier: string,
): string {
  const range = resolveTransactionsListApiRange(dateSelection, customDates)
  const presetKey = dateSelectionToQueryKey(dateSelection)
  const customKey = transactionCustomDateQueryKey(customDates)
  const cashierKey = cashier.trim() || 'all'
  const rangeKey =
    range.from && range.to ? `${range.from}|${range.to}` : presetKey
  return [presetKey, customKey, cashierKey, rangeKey].join('::')
}

export function labelForCashierFilter(value: string): string {
  const v = value.trim()
  return v ? v : 'All cashiers'
}

/** Date-filter trigger: month / quarter plus optional From / To datetimes. */
export function labelForLedgerDateFilter(
  filterValue: string,
  customFrom: string,
  customTo: string,
): string {
  const base = labelForTransactionDateFilter(filterValue, '', '')
  const from = customFrom.trim()
  const to = customTo.trim()
  if (!from || !to) return base
  if (from.includes('T') || to.includes('T')) {
    return `${base} · ${labelForCustomDatetimeRange(from, to)}`
  }
  return `${base} · ${from} → ${to}`
}
