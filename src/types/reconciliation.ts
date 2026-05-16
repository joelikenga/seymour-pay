import type { PaymentChannel, Transaction, VehicleType } from './transaction'
import type { CashierShift } from '../lib/cashierShift'

export type { CashierShift }

export interface Cashpoint {
  id: string
  name: string
}

/** Cashpoint card stats (`GET /admin/reconciliation/cashpoints` with date range). */
export interface CashpointSummary extends Cashpoint {
  totalSales: number
  transactionCount: number
}

/** Cashier summary for the card grid (`GET /admin/reconciliation/cashiers`). */
export interface CashierSummary {
  id: string
  firstName: string
  /** Kept for API compatibility; UI should use {@link firstName}. */
  displayName: string
  shift: CashierShift
  email: string
  photoUrl: string | null
  totalSales: number
  transactionCount: number
  cashpointIds: string[]
}

export interface CashierTransaction extends Transaction {
  cashierId: string
  cashierName: string
  shift: CashierShift
  cashpointId: string
  cashpointName: string
}

/** Loss ticket row — same core fields as ledger plus optional reason. */
export interface LossTicketRow {
  id: string
  reference: string
  customerName: string
  amount: number
  channel: PaymentChannel
  vehicleType: VehicleType
  status: Transaction['status']
  createdAt: string
  notes: string
  /** e.g. misplaced ticket, exit without pay */
  lossReason?: string
}

export type PaginatedCashierTransactions = {
  data: CashierTransaction[]
  page: number
  page_size: number
  total: number
  total_pages: number
  /** Sum of `amount` for all rows matching the current filters (not just this page). */
  filtered_volume: number
}

export type PaginatedCashpointTransactions = PaginatedCashierTransactions

export type PaginatedLossTickets = {
  data: LossTicketRow[]
  page: number
  page_size: number
  total: number
  total_pages: number
}
