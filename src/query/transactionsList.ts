import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { normalizeTransactionRow } from '../lib/normalizeTransaction'
import type { DateFilterSelection } from '../lib/transactionDateFilter'
import {
  resolveTransactionsListApiDatetimeRange,
  type TransactionCustomDateBounds,
  transactionsListFiltersQueryKey,
} from '../lib/transactionLedgerFilters'
import { unwrapPaginatedListBody } from '../lib/unwrapPaginatedApi'
import type { PaginatedTransactionsResponse } from '../types/paginatedTransactions'
import { TransactionsApi } from '../utils'

export const transactionsListQueryKey = ['admin', 'transactions', 'list'] as const
export const lostTicketsListQueryKey = ['admin', 'lost-tickets', 'list'] as const
export const recentTransactionsQueryKey = ['admin', 'transactions', 'recent'] as const

export const TRANSACTIONS_PAGE_SIZE = 12
/** Reconciliation table uses a smaller page size. */
export const RECONCILIATION_PAGE_SIZE = 10
const RECENT_COUNT = 5

export type TransactionListFilterOptions = {
  /** Return only lost-ticket ledger rows (`is_lost_ticket=true`). */
  lostTicketOnly?: boolean
  cashier?: string
  customDates?: TransactionCustomDateBounds
}

function buildTransactionsListParams(
  pageIndex: number,
  pageSize: number,
  search: string,
  dateSelection: DateFilterSelection,
  options?: TransactionListFilterOptions,
) {
  const range = resolveTransactionsListApiDatetimeRange(
    dateSelection,
    options?.customDates ?? { from: '', to: '' },
  )
  const trimmedSearch = search.trim()
  const cashier = options?.cashier?.trim()
  const lostTicketOnly = options?.lostTicketOnly === true
  return {
    page: pageIndex + 1,
    page_size: pageSize,
    status: 'completed' as const,
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
    ...(range.from && range.to ? { from: range.from, to: range.to } : {}),
    is_lost_ticket: lostTicketOnly,
    ...(cashier && cashier !== 'all' ? { created_by: cashier } : {}),
  }
}

function parsePaginatedResponse(
  raw: unknown,
  fallbackPageIndex: number,
  fallbackPageSize: number,
): PaginatedTransactionsResponse {
  const r = unwrapPaginatedListBody(raw)
  const rows = Array.isArray(r.data)
    ? r.data
        .map((item) => normalizeTransactionRow(item))
        .filter((x): x is NonNullable<typeof x> => x != null)
    : []
  const pageSize =
    typeof r.page_size === 'number' ? r.page_size : fallbackPageSize
  const total = typeof r.total === 'number' ? r.total : rows.length
  const total_pages =
    typeof r.total_pages === 'number'
      ? r.total_pages
      : total > 0 && pageSize > 0
        ? Math.ceil(total / pageSize)
        : 0
  const apiPage =
    typeof r.page === 'number' && r.page > 0 ? r.page - 1 : fallbackPageIndex
  return {
    data: rows,
    page: apiPage,
    page_size: pageSize,
    total,
    total_pages,
  }
}

export function useTransactionsListQuery(
  pageIndex: number,
  search: string,
  dateSelection: DateFilterSelection,
  pageSize: number = TRANSACTIONS_PAGE_SIZE,
  options?: TransactionListFilterOptions,
): UseQueryResult<PaginatedTransactionsResponse, Error> {
  const lostTicketOnly = options?.lostTicketOnly === true
  const customDates = options?.customDates ?? { from: '', to: '' }
  const cashier = options?.cashier ?? ''
  const filtersKey = transactionsListFiltersQueryKey(
    dateSelection,
    customDates,
    cashier,
  )
  const trimmedSearch = search.trim()
  const baseKey = lostTicketOnly ? lostTicketsListQueryKey : transactionsListQueryKey

  return useQuery({
    queryKey: [
      ...baseKey,
      pageIndex,
      pageSize,
      trimmedSearch,
      filtersKey,
    ],
    queryFn: async ({ signal }) => {
      const raw = await TransactionsApi.adminGetTransactionsList(
        buildTransactionsListParams(
          pageIndex,
          pageSize,
          search,
          dateSelection,
          options,
        ),
        signal,
      )
      return parsePaginatedResponse(raw, pageIndex, pageSize)
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

/** Latest rows for dashboard (newest first - assumes API returns sorted desc). */
export function useRecentTransactionsQuery(): UseQueryResult<
  PaginatedTransactionsResponse,
  Error
> {
  return useQuery({
    queryKey: [...recentTransactionsQueryKey, RECENT_COUNT],
    queryFn: async () => {
      const raw = await TransactionsApi.adminGetTransactionsList({
        page: 1,
        page_size: RECENT_COUNT,
        status: 'completed',
        is_lost_ticket: false,
      })
      return parsePaginatedResponse(raw, 0, RECENT_COUNT)
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

