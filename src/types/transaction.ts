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
  reference: string
  customerName: string
  amount: number
  channel: PaymentChannel
  /** Vehicle category at the car park (pricing / reporting). */
  vehicleType: VehicleType
  status: TransactionStatus
  createdAt: string
  notes: string
}
