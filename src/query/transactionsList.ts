import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { normalizeTransactionRow } from '../lib/normalizeTransaction'
import {
  dateSelectionToApiRange,
  dateSelectionToQueryKey,
  type DateFilterSelection,
} from '../lib/transactionDateFilter'
import type { PaginatedTransactionsResponse } from '../types/paginatedTransactions'
import type { Transaction } from '../types/transaction'
import { TransactionsApi } from '../utils'

export const transactionsListQueryKey = ['admin', 'transactions', 'list'] as const
export const recentTransactionsQueryKey = ['admin', 'transactions', 'recent'] as const

export const TRANSACTIONS_PAGE_SIZE = 12
/** Reconciliation table uses a smaller page size. */
export const RECONCILIATION_PAGE_SIZE = 10
const RECENT_COUNT = 5

interface RawPaginated {
  data?: unknown[]
  page?: number
  page_size?: number
  total?: number
  total_pages?: number
}

function parsePaginatedResponse(
  raw: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
): PaginatedTransactionsResponse {
  const r = raw as RawPaginated
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
  return {
    data: rows,
    page: typeof r.page === 'number' ? r.page : fallbackPage,
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
  const range = dateSelectionToApiRange(dateSelection)
  const rangeKey = dateSelectionToQueryKey(dateSelection)
  return useQuery({
    queryKey: [
      ...transactionsListQueryKey,
      pageIndex,
      pageSize,
      search.trim(),
      rangeKey,
    ],
    queryFn: async () => {
      const raw = await TransactionsApi.adminGetTransactionsList({
        page: pageIndex,
        page_size: pageSize,
        search: search.trim() || undefined,
        ...(range.from && range.to
          ? { from: range.from, to: range.to }
          : {}),
      })
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
        page: 0,
        page_size: RECENT_COUNT,
      })
      return parsePaginatedResponse(raw, 0, RECENT_COUNT)
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

/** Up to 5000 rows matching `search` and optional date range for CSV export. */
export async function fetchTransactionsForExport(
  search: string,
  dateSelection: DateFilterSelection,
): Promise<Transaction[]> {
  const trimmed = search.trim()
  const range = dateSelectionToApiRange(dateSelection)
  const rangeParams =
    range.from && range.to ? { from: range.from, to: range.to } : {}
  const first = await TransactionsApi.adminGetTransactionsList({
    page: 0,
    page_size: 1,
    search: trimmed || undefined,
    ...rangeParams,
  })
  const r0 = first as RawPaginated
  const total = typeof r0.total === 'number' ? r0.total : 0
  if (total === 0) return []
  const cap = Math.min(total, 5000)
  const raw = await TransactionsApi.adminGetTransactionsList({
    page: 0,
    page_size: cap,
    search: trimmed || undefined,
    ...rangeParams,
  })
  return parsePaginatedResponse(raw, 0, cap).data
}
