import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { normalizeTransactionRow } from '../lib/normalizeTransaction'
import {
  dateSelectionToTransactionsApiRange,
  dateSelectionToQueryKey,
  type DateFilterSelection,
} from '../lib/transactionDateFilter'
import { unwrapPaginatedListBody } from '../lib/unwrapPaginatedApi'
import type { PaginatedTransactionsResponse } from '../types/paginatedTransactions'
import type { Transaction } from '../types/transaction'
import { TransactionsApi } from '../utils'

export const transactionsListQueryKey = ['admin', 'transactions', 'list'] as const
export const recentTransactionsQueryKey = ['admin', 'transactions', 'recent'] as const

export const TRANSACTIONS_PAGE_SIZE = 12
/** Reconciliation table uses a smaller page size. */
export const RECONCILIATION_PAGE_SIZE = 10
const RECENT_COUNT = 5

const EXPORT_FETCH_CAP = 5000

function buildTransactionsListParams(
  pageIndex: number,
  pageSize: number,
  search: string,
  dateSelection: DateFilterSelection,
) {
  const range = dateSelectionToTransactionsApiRange(dateSelection)
  const trimmedSearch = search.trim()
  return {
    page: pageIndex + 1,
    page_size: pageSize,
    status: 'completed' as const,
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
    ...(range.from && range.to ? { from: range.from, to: range.to } : {}),
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
): UseQueryResult<PaginatedTransactionsResponse, Error> {
  const rangeKey = dateSelectionToQueryKey(dateSelection)
  const trimmedSearch = search.trim()

  return useQuery({
    queryKey: [
      ...transactionsListQueryKey,
      pageIndex,
      pageSize,
      trimmedSearch,
      rangeKey,
    ],
    queryFn: async ({ signal }) => {
      const raw = await TransactionsApi.adminGetTransactionsList(
        buildTransactionsListParams(
          pageIndex,
          pageSize,
          search,
          dateSelection,
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
      })
      return parsePaginatedResponse(raw, 0, RECENT_COUNT)
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

/** Up to 5000 rows matching `search` and optional date range for export. */
export async function fetchTransactionsForExport(
  search: string,
  dateSelection: DateFilterSelection,
): Promise<Transaction[]> {
  const base = buildTransactionsListParams(0, 1, search, dateSelection)
  const first = await TransactionsApi.adminGetTransactionsList({
    ...base,
    page: 1,
    page_size: 1,
  })
  const r0 = unwrapPaginatedListBody(first)
  const total = typeof r0.total === 'number' ? r0.total : 0
  if (total === 0) return []

  const cap = Math.min(total, EXPORT_FETCH_CAP)
  const raw = await TransactionsApi.adminGetTransactionsList({
    ...base,
    page: 1,
    page_size: cap,
  })
  return parsePaginatedResponse(raw, 0, cap).data
}
