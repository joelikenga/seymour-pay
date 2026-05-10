import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { normalizeTransactionRow } from '../lib/normalizeTransaction'
import type { PaginatedTransactionsResponse } from '../types/paginatedTransactions'
import { SettlementApi } from '../utils'

export const settlementTransactionsQueryKey = ['admin', 'settlement'] as const

export const SETTLEMENT_PAGE_SIZE = 20

interface RawSettlementResponse {
  data?: unknown[]
  page?: number
  page_size?: number
  total?: number
  total_pages?: number
}

export function useSettlementTransactionsQuery(
  page: number,
): UseQueryResult<PaginatedTransactionsResponse, Error> {
  return useQuery({
    queryKey: [...settlementTransactionsQueryKey, page, SETTLEMENT_PAGE_SIZE],
    queryFn: async () => {
      const raw = (await SettlementApi.adminGetSettlement({
        page,
        page_size: SETTLEMENT_PAGE_SIZE,
      })) as RawSettlementResponse
      const rows = Array.isArray(raw.data)
        ? raw.data
            .map((item: unknown) => normalizeTransactionRow(item))
            .filter((x): x is NonNullable<typeof x> => x != null)
        : []
      const pageSize =
        typeof raw.page_size === 'number' ? raw.page_size : SETTLEMENT_PAGE_SIZE
      const total = typeof raw.total === 'number' ? raw.total : rows.length
      const total_pages =
        typeof raw.total_pages === 'number'
          ? raw.total_pages
          : total > 0 && pageSize > 0
            ? Math.ceil(total / pageSize)
            : 0
      return {
        data: rows,
        page: typeof raw.page === 'number' ? raw.page : page,
        page_size: pageSize,
        total,
        total_pages,
      }
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}
