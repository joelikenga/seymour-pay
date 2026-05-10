import type { PaymentChannel, Transaction, TransactionStatus, VehicleType } from '../types/transaction'

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const x = Number(v)
    if (Number.isFinite(x)) return x
  }
  return 0
}

const CHANNELS: PaymentChannel[] = ['cash', 'pos', 'transfer', 'epayment', 'ussd']

/** Coerce API channel strings to a known {@link PaymentChannel}. */
export function normalizePaymentChannel(raw: unknown): PaymentChannel {
  const s = typeof raw === 'string' ? raw.toLowerCase() : ''
  return CHANNELS.includes(s as PaymentChannel) ? (s as PaymentChannel) : 'cash'
}

const STATUSES: TransactionStatus[] = ['completed', 'pending', 'failed', 'reconciled']

function normalizeStatus(raw: unknown): TransactionStatus {
  const s = typeof raw === 'string' ? raw.toLowerCase() : ''
  return STATUSES.includes(s as TransactionStatus)
    ? (s as TransactionStatus)
    : 'pending'
}

/** Maps API / snake_case variants to app {@link VehicleType}. */
export function normalizeVehicleType(raw: unknown): VehicleType {
  const s = typeof raw === 'string' ? raw.toLowerCase().replace(/-/g, '_') : ''
  const map: Record<string, VehicleType> = {
    car: 'car',
    small_suv: 'small_suv',
    smallsuv: 'small_suv',
    big_suv: 'big_suv',
    bigsuv: 'big_suv',
    bus: 'bus',
    coaster: 'coaster',
  }
  return map[s] ?? 'car'
}

/** Backend PUT body uses mixed casing for vehicle (see transactions API types). */
export function vehicleTypeToApiPayload(v: VehicleType): string {
  const m: Record<VehicleType, string> = {
    car: 'car',
    small_suv: 'small_SUV',
    big_suv: 'big_SUV',
    bus: 'bus',
    coaster: 'coaster',
  }
  return m[v]
}

export function normalizeTransactionRow(raw: unknown): Transaction | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : ''
  if (!id) return null
  return {
    id,
    reference: typeof o.reference === 'string' ? o.reference : '',
    customerName: typeof o.customerName === 'string' ? o.customerName : '',
    amount: num(o.amount),
    channel: normalizePaymentChannel(o.channel),
    vehicleType: normalizeVehicleType(o.vehicleType ?? o.vehicle_type),
    status: normalizeStatus(o.status),
    createdAt:
      typeof o.createdAt === 'string'
        ? o.createdAt
        : typeof o.created_at === 'string'
          ? o.created_at
          : new Date().toISOString(),
    notes: typeof o.notes === 'string' ? o.notes : '',
  }
}
