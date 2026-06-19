/** Aviation car park vehicle classification. */
export type VehicleType =
  | 'car'
  | 'small_suv'
  | 'big_suv'
  | 'bus'
  | 'coaster'

/** In-person; does not use Fidelity pay rails. */
export type PaymentChannel =
  | 'cash'
  | 'pos'
  | 'transfer'
  | 'epayment'
  | 'ussd'

export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'reconciled'

export interface Transaction {
  id: string
  /**
   * Display identifier. Populated from API `reference` when present, otherwise
   * falls back to `ticket_id` (the ledger API now sends an empty reference).
   */
  reference: string
  /** Raw `ticket_id` from the ledger API (e.g. `19082EB6DC47`). */
  ticketId: string
  /** Ledger entry code (e.g. `20260605105914441_31`). */
  code: string
  customerName: string
  amount: number
  channel: PaymentChannel
  /** Vehicle category at the car park (pricing / reporting). */
  vehicleType: VehicleType
  status: TransactionStatus
  createdAt: string
  notes: string
  isLostTicket: boolean
  /** `carfee_id` from the ledger API - Pay ID. */
  carfeeId: string
  /** `created_by` from the ledger API - cashier username. */
  createdBy: string
  entryTime: string | null
  exitTime: string | null
}
