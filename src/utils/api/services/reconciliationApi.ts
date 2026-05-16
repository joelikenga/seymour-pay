import {
  USE_RECONCILIATION_DUMMY_DATA,
  dummyGetCashierTransactions,
  dummyGetCashiers,
  dummyGetCashpointSummaries,
  dummyGetCashpointTransactions,
  dummyGetCashpoints,
  dummyGetLossTickets,
} from '../../../data/reconciliationDummyData'
import type { CashierShift } from '../../../lib/cashierShift'
import type {
  CashierSummary,
  Cashpoint,
  CashpointSummary,
  PaginatedCashpointTransactions,
  PaginatedLossTickets,
} from '../../../types/reconciliation'

export type ReconciliationDateParams = {
  from?: string
  to?: string
}

export type ReconciliationCashiersParams = ReconciliationDateParams & {
  shift?: CashierShift
}

export type CashierTransactionsParams = ReconciliationDateParams & {
  page: number
  page_size?: number
  cashpoint?: string
  shift?: CashierShift
  from_datetime?: string
  to_datetime?: string
}

export type CashpointTransactionsParams = ReconciliationDateParams & {
  page: number
  page_size?: number
}

export type LossTicketsListParams = ReconciliationDateParams & {
  page: number
  page_size?: number
  search?: string
}

export async function adminGetCashiers(
  params?: ReconciliationCashiersParams,
): Promise<CashierSummary[]> {
  if (USE_RECONCILIATION_DUMMY_DATA) {
    return dummyGetCashiers(params)
  }
  throw new Error('Cashiers API not configured')
}

export async function adminGetCashpoints(): Promise<Cashpoint[]> {
  if (USE_RECONCILIATION_DUMMY_DATA) {
    return dummyGetCashpoints()
  }
  throw new Error('Cashpoints API not configured')
}

export async function adminGetCashpointSummaries(
  params?: ReconciliationDateParams,
): Promise<CashpointSummary[]> {
  if (USE_RECONCILIATION_DUMMY_DATA) {
    return dummyGetCashpointSummaries(params)
  }
  throw new Error('Cashpoint summaries API not configured')
}

export async function adminGetCashpointTransactions(
  cashpointId: string,
  params: CashpointTransactionsParams,
): Promise<PaginatedCashpointTransactions> {
  const page_size = params.page_size ?? 12
  if (USE_RECONCILIATION_DUMMY_DATA) {
    return dummyGetCashpointTransactions(cashpointId, {
      page: params.page,
      page_size,
      from: params.from,
      to: params.to,
    })
  }
  throw new Error('Cashpoint transactions API not configured')
}

export async function adminGetCashierTransactions(
  cashierId: string,
  params: CashierTransactionsParams,
): Promise<PaginatedCashpointTransactions> {
  const page_size = params.page_size ?? 12
  if (USE_RECONCILIATION_DUMMY_DATA) {
    return dummyGetCashierTransactions(cashierId, {
      page: params.page,
      page_size,
      from: params.from,
      to: params.to,
      cashpoint: params.cashpoint,
      shift: params.shift,
      from_datetime: params.from_datetime,
      to_datetime: params.to_datetime,
    })
  }
  throw new Error('Cashier transactions API not configured')
}

export async function adminGetLossTickets(
  params: LossTicketsListParams,
): Promise<PaginatedLossTickets> {
  const page_size = params.page_size ?? 12
  if (USE_RECONCILIATION_DUMMY_DATA) {
    return dummyGetLossTickets({
      page: params.page,
      page_size,
      search: params.search,
      from: params.from,
      to: params.to,
    })
  }
  throw new Error('Loss tickets API not configured')
}
