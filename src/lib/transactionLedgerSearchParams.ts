import { defaultTransactionFilterYear } from './transactionDateFilter'

export type TransactionLedgerUrlFilters = {
  filterValue: string
  customStart: string
  customEnd: string
  cashier: string
  search: string
}

export function defaultLedgerFilterValue(now: Date = new Date()): string {
  const year = defaultTransactionFilterYear(now)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `month:${year}-${month}`
}

function isValidLedgerPeriod(value: string): boolean {
  return value.startsWith('month:') || value.startsWith('quarter:')
}

export function readLedgerFiltersFromSearchParams(
  params: URLSearchParams,
  options?: { allowCashier?: boolean; allowCustomDates?: boolean },
): TransactionLedgerUrlFilters {
  const allowCashier = options?.allowCashier ?? true
  const allowCustomDates = options?.allowCustomDates ?? true
  const rawPeriod = params.get('period')?.trim() ?? ''
  const filterValue = isValidLedgerPeriod(rawPeriod)
    ? rawPeriod
    : defaultLedgerFilterValue()

  return {
    filterValue,
    customStart:
      allowCustomDates && params.get('from')?.trim()
        ? params.get('from')!.trim()
        : '',
    customEnd:
      allowCustomDates && params.get('to')?.trim()
        ? params.get('to')!.trim()
        : '',
    cashier:
      allowCashier && params.get('cashier')?.trim()
        ? params.get('cashier')!.trim()
        : 'all',
    search: params.get('search')?.trim() ?? '',
  }
}

export function applyLedgerFiltersToSearchParams(
  base: URLSearchParams,
  filters: TransactionLedgerUrlFilters,
  options?: { allowCashier?: boolean; allowCustomDates?: boolean },
): URLSearchParams {
  const allowCashier = options?.allowCashier ?? true
  const allowCustomDates = options?.allowCustomDates ?? true
  const next = new URLSearchParams(base)
  const defaultPeriod = defaultLedgerFilterValue()

  if (filters.filterValue && filters.filterValue !== defaultPeriod) {
    next.set('period', filters.filterValue)
  } else {
    next.delete('period')
  }

  if (allowCustomDates && filters.customStart.trim()) {
    next.set('from', filters.customStart.trim())
  } else {
    next.delete('from')
  }

  if (allowCustomDates && filters.customEnd.trim()) {
    next.set('to', filters.customEnd.trim())
  } else {
    next.delete('to')
  }

  if (
    allowCashier &&
    filters.cashier.trim() &&
    filters.cashier.trim() !== 'all'
  ) {
    next.set('cashier', filters.cashier.trim())
  } else {
    next.delete('cashier')
  }

  if (filters.search.trim()) {
    next.set('search', filters.search.trim())
  } else {
    next.delete('search')
  }

  return next
}
