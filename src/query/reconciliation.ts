import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type {
  CashierSummary,
  Cashpoint,
  CashpointSummary,
  PaginatedCashpointTransactions,
  PaginatedLossTickets,
} from '../types/reconciliation'

import {
  adminGetCashierTransactions,
  adminGetCashiers,
  adminGetCashpointSummaries,
  adminGetCashpointTransactions,
  adminGetCashpoints,
  adminGetLossTickets,
  type CashierTransactionsParams,
  type CashpointTransactionsParams,
  type ReconciliationCashiersParams,
  type ReconciliationDateParams,
} from '../utils/api/services/reconciliationApi'

export const CASHIER_TX_PAGE_SIZE = 12
export const LOSS_TICKET_PAGE_SIZE = 12

export function cashiersQueryKey(params: ReconciliationCashiersParams) {
  return [
    'admin',
    'reconciliation',
    'cashiers',
    params.from ?? '',
    params.to ?? '',
    params.shift ?? '',
  ] as const
}

export function cashpointSummariesQueryKey(params: ReconciliationDateParams) {
  return [
    'admin',
    'reconciliation',
    'cashpoint-summaries',
    params.from ?? '',
    params.to ?? '',
  ] as const
}

export function cashpointTransactionsQueryKey(
  cashpointId: string,
  params: Omit<CashpointTransactionsParams, 'page' | 'page_size'> & {
    pageIndex: number
  },
) {
  return [
    'admin',
    'reconciliation',
    'cashpoint-transactions',
    cashpointId,
    params.pageIndex,
    params.from ?? '',
    params.to ?? '',
  ] as const
}

export function cashierTransactionsQueryKey(
  cashierId: string,
  params: Omit<CashierTransactionsParams, 'page' | 'page_size'> & { pageIndex: number },
) {
  return [
    'admin',
    'reconciliation',
    'cashier-transactions',
    cashierId,
    params.pageIndex,
    params.from ?? '',
    params.to ?? '',
    params.from_datetime ?? '',
    params.to_datetime ?? '',
    params.cashpoint ?? '',
    params.shift ?? '',
  ] as const
}

export function lossTicketsQueryKey(
  pageIndex: number,
  search: string,
  params: ReconciliationDateParams,
) {
  return [
    'admin',
    'reconciliation',
    'loss-tickets',
    pageIndex,
    search.trim(),
    params.from ?? '',
    params.to ?? '',
  ] as const
}

export function useCashiersQuery(
  params: ReconciliationCashiersParams,
  enabled = true,
): UseQueryResult<CashierSummary[], Error> {
  return useQuery({
    queryKey: cashiersQueryKey(params),
    queryFn: () => adminGetCashiers(params),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useCashpointSummariesQuery(
  params: ReconciliationDateParams,
  enabled = true,
): UseQueryResult<CashpointSummary[], Error> {
  return useQuery({
    queryKey: cashpointSummariesQueryKey(params),
    queryFn: () => adminGetCashpointSummaries(params),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useCashpointsQuery(
  enabled = true,
): UseQueryResult<Cashpoint[], Error> {
  return useQuery({
    queryKey: ['admin', 'reconciliation', 'cashpoints'] as const,
    queryFn: () => adminGetCashpoints(),
    enabled,
    staleTime: 60_000,
  })
}

export function useCashpointTransactionsQuery(
  cashpointId: string | null,
  pageIndex: number,
  params: Omit<CashpointTransactionsParams, 'page' | 'page_size'>,
  enabled = true,
): UseQueryResult<PaginatedCashpointTransactions, Error> {
  return useQuery({
    queryKey: cashpointTransactionsQueryKey(cashpointId ?? '', {
      ...params,
      pageIndex,
    }),
    queryFn: () =>
      adminGetCashpointTransactions(cashpointId!, {
        ...params,
        page: pageIndex,
        page_size: CASHIER_TX_PAGE_SIZE,
      }),
    enabled: Boolean(cashpointId) && enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useCashierTransactionsQuery(
  cashierId: string | null,
  pageIndex: number,
  params: Omit<CashierTransactionsParams, 'page' | 'page_size' | 'cashierId'>,
  enabled = true,
): UseQueryResult<PaginatedCashpointTransactions, Error> {
  return useQuery({
    queryKey: cashierTransactionsQueryKey(cashierId ?? '', {
      ...params,
      pageIndex,
    }),
    queryFn: () =>
      adminGetCashierTransactions(cashierId!, {
        ...params,
        page: pageIndex,
        page_size: CASHIER_TX_PAGE_SIZE,
      }),
    enabled: Boolean(cashierId) && enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useLossTicketsQuery(
  pageIndex: number,
  search: string,
  params: ReconciliationDateParams,
  enabled = true,
): UseQueryResult<PaginatedLossTickets, Error> {
  return useQuery({
    queryKey: lossTicketsQueryKey(pageIndex, search, params),
    queryFn: () =>
      adminGetLossTickets({
        page: pageIndex,
        page_size: LOSS_TICKET_PAGE_SIZE,
        search: search.trim() || undefined,
        ...params,
      }),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}
