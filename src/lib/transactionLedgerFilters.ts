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
  const customFrom = filterBoundCalendarDate(customDates.from)
  const customTo = filterBoundCalendarDate(customDates.to)

  if (dateSelection.kind === 'custom' || (customFrom && customTo)) {
    const fromVal =
      customFrom ||
      (dateSelection.kind === 'custom'
        ? filterBoundCalendarDate(dateSelection.start)
        : '')
    const toVal =
      customTo ||
      (dateSelection.kind === 'custom'
        ? filterBoundCalendarDate(dateSelection.end)
        : '')
    if (!fromVal || !toVal) return {}
    const [from, to] = fromVal <= toVal ? [fromVal, toVal] : [toVal, fromVal]
    return { from, to }
  }

  const base = dateSelectionToTransactionsApiRange(dateSelection)
  if (!base.from || !base.to) return base

  return { from: base.from, to: base.to }
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
  const customFrom = customDates.from.trim()
  const customTo = customDates.to.trim()

  if (dateSelection.kind === 'custom' || (customFrom && customTo)) {
    const fromVal =
      customFrom || (dateSelection.kind === 'custom' ? dateSelection.start : '')
    const toVal =
      customTo || (dateSelection.kind === 'custom' ? dateSelection.end : '')
    if (!fromVal || !toVal) return {}

    const start = parseCustomRangeBound(fromVal, 'start')
    const end = parseCustomRangeBound(toVal, 'end')
    if (!start || !end) return {}

    const [clampedStart, clampedEnd] =
      start <= end ? [start, end] : [end, start]

    return {
      from: dateToLocalApiDatetime(clampedStart),
      to: dateToLocalApiDatetime(clampedEnd),
    }
  }

  const base = dateSelectionToTransactionsApiRange(dateSelection)
  if (!base.from || !base.to) return {}

  return { from: base.from, to: base.to }
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
  const from = customFrom.trim()
  const to = customTo.trim()
  if (filterValue === 'custom') {
    if (from && to) return labelForCustomDatetimeRange(from, to)
    return 'Custom range'
  }
  const base = labelForTransactionDateFilter(filterValue, '', '')
  if (!from || !to) return base
  if (from.includes('T') || to.includes('T')) {
    return `${base} · ${labelForCustomDatetimeRange(from, to)}`
  }
  return `${base} · ${from} → ${to}`
}
