import type {
  CashierSummary,
  CashierTransaction,
  Cashpoint,
  CashpointSummary,
  LossTicketRow,
  PaginatedCashierTransactions,
  PaginatedLossTickets,
} from '../types/reconciliation'
import type { PaymentChannel, VehicleType } from '../types/transaction'
import type { CashierShift } from '../lib/cashierShift'
import { shiftFromIso } from '../lib/cashierShift'

/** Swap to `false` when backend routes are live. */
export const USE_RECONCILIATION_DUMMY_DATA = true

export const DUMMY_CASHPOINTS: Cashpoint[] = [
  { id: 'cp-21', name: 'Cashpoint21' },
  { id: 'cp-22', name: 'Cashpoint22' },
  { id: 'cp-23', name: 'Cashpoint23' },
  { id: 'cp-24', name: 'Cashpoint24' },
]

const CASHIERS_BASE: Omit<CashierSummary, 'totalSales' | 'transactionCount'>[] = [
  {
    id: 'cashier-ada',
    firstName: 'Ada',
    displayName: 'Ada',
    shift: 1,
    email: 'ada.okafor@seymouraviation.ng',
    photoUrl: null,
    cashpointIds: ['cp-21', 'cp-23'],
  },
  {
    id: 'cashier-kunle',
    firstName: 'Kunle',
    displayName: 'Kunle',
    shift: 2,
    email: 'kunle.bakare@seymouraviation.ng',
    photoUrl: null,
    cashpointIds: ['cp-22', 'cp-24'],
  },
  {
    id: 'cashier-fatima',
    firstName: 'Fatima',
    displayName: 'Fatima',
    shift: 1,
    email: 'fatima.bello@seymouraviation.ng',
    photoUrl: null,
    cashpointIds: ['cp-21', 'cp-22'],
  },
  {
    id: 'cashier-chidi',
    firstName: 'Chidi',
    displayName: 'Chidi',
    shift: 3,
    email: 'chidi.nwosu@seymouraviation.ng',
    photoUrl: null,
    cashpointIds: ['cp-23', 'cp-24'],
  },
]

function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function cashpointName(id: string): string {
  return DUMMY_CASHPOINTS.find((c) => c.id === id)?.name ?? id
}

function buildCashierTransactions(): CashierTransaction[] {
  const rows: CashierTransaction[] = []
  let seq = 1
  const add = (
    cashierId: string,
    cashierName: string,
    cashpointId: string,
    channel: PaymentChannel,
    vehicle: VehicleType,
    amount: number,
    createdAt: string,
    reference?: string,
  ) => {
    const ref = reference ?? `CSH-${String(seq).padStart(4, '0')}`
    seq += 1
    rows.push({
      id: `ctx-${cashierId}-${seq}`,
      reference: ref,
      ticketId: ref,
      code: '',
      isLostTicket: false,
      customerName: 'Walk-in customer',
      amount,
      channel,
      vehicleType: vehicle,
      status: 'completed',
      createdAt,
      notes: '',
      cashierId,
      cashierName,
      shift: shiftFromIso(createdAt),
      cashpointId,
      cashpointName: cashpointName(cashpointId),
      carfeeId: ref,
      createdBy: cashierName,
      entryTime: null,
      exitTime: null,
    })
  }

  add('cashier-ada', 'Ada', 'cp-21', 'cash', 'car', 5000, daysAgo(0, 9, 12))
  add('cashier-ada', 'Ada', 'cp-21', 'pos', 'small_suv', 8500, daysAgo(0, 11, 45))
  add('cashier-ada', 'Ada', 'cp-23', 'cash', 'car', 4500, daysAgo(1, 14, 20))
  add('cashier-ada', 'Ada', 'cp-23', 'transfer', 'big_suv', 12000, daysAgo(2, 16, 5))
  add('cashier-ada', 'Ada', 'cp-21', 'pos', 'car', 5000, daysAgo(3, 8, 30))
  add('cashier-ada', 'Ada', 'cp-21', 'epayment', 'coaster', 25000, daysAgo(5, 10, 0))
  add('cashier-ada', 'Ada', 'cp-23', 'cash', 'bus', 15000, daysAgo(8, 13, 15))
  add('cashier-ada', 'Ada', 'cp-21', 'ussd', 'car', 3500, daysAgo(12, 17, 40), 'CSH-0099')

  add('cashier-kunle', 'Kunle', 'cp-22', 'pos', 'car', 5000, daysAgo(0, 8, 5))
  add('cashier-kunle', 'Kunle', 'cp-22', 'cash', 'small_suv', 7000, daysAgo(0, 15, 22))
  add('cashier-kunle', 'Kunle', 'cp-24', 'transfer', 'car', 18000, daysAgo(1, 9, 50))
  add('cashier-kunle', 'Kunle', 'cp-22', 'pos', 'big_suv', 9500, daysAgo(4, 11, 10))
  add('cashier-kunle', 'Kunle', 'cp-24', 'cash', 'car', 5000, daysAgo(6, 12, 0))
  add('cashier-kunle', 'Kunle', 'cp-22', 'epayment', 'small_suv', 8000, daysAgo(10, 14, 55))

  add('cashier-fatima', 'Fatima', 'cp-21', 'cash', 'car', 5000, daysAgo(0, 10, 18))
  add('cashier-fatima', 'Fatima', 'cp-22', 'pos', 'car', 5000, daysAgo(1, 11, 30))
  add('cashier-fatima', 'Fatima', 'cp-21', 'transfer', 'small_suv', 11000, daysAgo(2, 13, 45))
  add('cashier-fatima', 'Fatima', 'cp-22', 'cash', 'bus', 14000, daysAgo(4, 9, 0))
  add('cashier-fatima', 'Fatima', 'cp-21', 'pos', 'coaster', 22000, daysAgo(7, 16, 20))
  add('cashier-fatima', 'Fatima', 'cp-22', 'ussd', 'car', 3200, daysAgo(14, 18, 5))

  add('cashier-chidi', 'Chidi', 'cp-23', 'pos', 'car', 5000, daysAgo(0, 7, 40))
  add('cashier-chidi', 'Chidi', 'cp-24', 'cash', 'big_suv', 9000, daysAgo(0, 12, 8))
  add('cashier-chidi', 'Chidi', 'cp-23', 'cash', 'car', 5000, daysAgo(2, 15, 30))
  add('cashier-chidi', 'Chidi', 'cp-24', 'pos', 'small_suv', 7500, daysAgo(3, 10, 15))
  add('cashier-chidi', 'Chidi', 'cp-23', 'transfer', 'car', 16000, daysAgo(5, 14, 0))
  add('cashier-chidi', 'Chidi', 'cp-24', 'epayment', 'car', 5500, daysAgo(9, 11, 45))
  add('cashier-chidi', 'Chidi', 'cp-23', 'pos', 'bus', 18000, daysAgo(11, 8, 20))
  add('cashier-chidi', 'Chidi', 'cp-24', 'cash', 'car', 5000, daysAgo(0, 23, 15))

  return rows
}

const ALL_CASHIER_TX = buildCashierTransactions()

const DUMMY_LOSS_TICKETS: LossTicketRow[] = [
  {
    id: 'loss-1',
    reference: 'LOSS-2401',
    customerName: 'Unknown vehicle',
    amount: 5000,
    channel: 'cash',
    vehicleType: 'car',
    status: 'failed',
    createdAt: daysAgo(0, 18, 22),
    notes: 'Exit without validated ticket',
    lossReason: 'Exit without pay',
  },
  {
    id: 'loss-2',
    reference: 'LOSS-2402',
    customerName: 'Walk-in',
    amount: 8500,
    channel: 'pos',
    vehicleType: 'small_suv',
    status: 'pending',
    createdAt: daysAgo(1, 9, 15),
    notes: 'POS timeout - customer left',
    lossReason: 'POS declined / abandoned',
  },
  {
    id: 'loss-3',
    reference: 'LOSS-2398',
    customerName: 'Charter bus',
    amount: 22000,
    channel: 'transfer',
    vehicleType: 'coaster',
    status: 'failed',
    createdAt: daysAgo(2, 14, 40),
    notes: 'Transfer not confirmed within window',
    lossReason: 'Unconfirmed transfer',
  },
  {
    id: 'loss-4',
    reference: 'LOSS-2395',
    customerName: 'N/A',
    amount: 5000,
    channel: 'cash',
    vehicleType: 'car',
    status: 'failed',
    createdAt: daysAgo(3, 11, 5),
    notes: 'Misplaced paper ticket',
    lossReason: 'Lost ticket',
  },
  {
    id: 'loss-5',
    reference: 'LOSS-2390',
    customerName: 'Fleet SUV',
    amount: 9500,
    channel: 'pos',
    vehicleType: 'big_suv',
    status: 'pending',
    createdAt: daysAgo(4, 16, 50),
    notes: 'Awaiting bank reversal',
    lossReason: 'Chargeback pending',
  },
  {
    id: 'loss-6',
    reference: 'LOSS-2388',
    customerName: 'Walk-in',
    amount: 3500,
    channel: 'ussd',
    vehicleType: 'car',
    status: 'failed',
    createdAt: daysAgo(5, 8, 30),
    notes: 'USSD session expired',
    lossReason: 'USSD not completed',
  },
  {
    id: 'loss-7',
    reference: 'LOSS-2385',
    customerName: 'Long-stay guest',
    amount: 18000,
    channel: 'cash',
    vehicleType: 'car',
    status: 'failed',
    createdAt: daysAgo(6, 19, 10),
    notes: 'Overnight - no checkout payment',
    lossReason: 'Overstay without payment',
  },
  {
    id: 'loss-8',
    reference: 'LOSS-2380',
    customerName: 'N/A',
    amount: 12000,
    channel: 'epayment',
    vehicleType: 'small_suv',
    status: 'pending',
    createdAt: daysAgo(8, 13, 20),
    notes: 'E-payment reference mismatch',
    lossReason: 'Wrong payment reference',
  },
  {
    id: 'loss-9',
    reference: 'LOSS-2376',
    customerName: 'Bus operator',
    amount: 15000,
    channel: 'cash',
    vehicleType: 'bus',
    status: 'failed',
    createdAt: daysAgo(10, 10, 0),
    notes: 'Cash drawer shortage at shift close',
    lossReason: 'Cash shortage',
  },
  {
    id: 'loss-10',
    reference: 'LOSS-2370',
    customerName: 'Walk-in',
    amount: 5000,
    channel: 'pos',
    vehicleType: 'car',
    status: 'failed',
    createdAt: daysAgo(12, 15, 35),
    notes: 'Duplicate scan - single exit',
    lossReason: 'Duplicate entry',
  },
  {
    id: 'loss-11',
    reference: 'LOSS-2365',
    customerName: 'N/A',
    amount: 7000,
    channel: 'cash',
    vehicleType: 'small_suv',
    status: 'pending',
    createdAt: daysAgo(14, 12, 45),
    notes: 'Investigation open',
    lossReason: 'Under review',
  },
  {
    id: 'loss-12',
    reference: 'LOSS-2360',
    customerName: 'VIP drop-off',
    amount: 25000,
    channel: 'transfer',
    vehicleType: 'coaster',
    status: 'failed',
    createdAt: daysAgo(18, 17, 0),
    notes: 'No matching ledger credit',
    lossReason: 'Transfer not found',
  },
]

function parseYmd(isoOrDate: string): number {
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return 0
  return d.getTime()
}

function inYmdRange(iso: string, from?: string, to?: string): boolean {
  if (!from && !to) return true
  const t = parseYmd(iso)
  if (from) {
    const start = new Date(from)
    start.setHours(0, 0, 0, 0)
    if (t < start.getTime()) return false
  }
  if (to) {
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    if (t > end.getTime()) return false
  }
  return true
}

function inDatetimeRange(
  iso: string,
  from_datetime?: string,
  to_datetime?: string,
): boolean {
  if (!from_datetime && !to_datetime) return true
  const t = parseYmd(iso)
  if (from_datetime && t < parseYmd(from_datetime)) return false
  if (to_datetime && t > parseYmd(to_datetime)) return false
  return true
}

function paginate<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { data: T[]; total: number; total_pages: number } {
  const total = rows.length
  const total_pages = total > 0 ? Math.ceil(total / pageSize) : 0
  const start = page * pageSize
  return {
    data: rows.slice(start, start + pageSize),
    total,
    total_pages,
  }
}

const DUMMY_DELAY_MS = 280

function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, DUMMY_DELAY_MS))
}

export async function dummyGetCashpoints(): Promise<Cashpoint[]> {
  await delay()
  return [...DUMMY_CASHPOINTS]
}

export async function dummyGetCashpointSummaries(params?: {
  from?: string
  to?: string
}): Promise<CashpointSummary[]> {
  await delay()
  return DUMMY_CASHPOINTS.map((cp) => {
    const txs = ALL_CASHIER_TX.filter(
      (t) =>
        t.cashpointId === cp.id &&
        inYmdRange(t.createdAt, params?.from, params?.to),
    )
    return {
      ...cp,
      totalSales: txs.reduce((s, t) => s + t.amount, 0),
      transactionCount: txs.length,
    }
  })
}

export async function dummyGetCashpointTransactions(
  cashpointId: string,
  params: {
    page: number
    page_size: number
    from?: string
    to?: string
  },
): Promise<PaginatedCashierTransactions> {
  await delay()
  let rows = ALL_CASHIER_TX.filter((t) => t.cashpointId === cashpointId)
  rows = rows.filter((t) => inYmdRange(t.createdAt, params.from, params.to))
  const filtered_volume = rows.reduce((s, t) => s + t.amount, 0)
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const { data, total, total_pages } = paginate(rows, params.page, params.page_size)
  return {
    data,
    page: params.page,
    page_size: params.page_size,
    total,
    total_pages,
    filtered_volume,
  }
}

export async function dummyGetCashiers(params?: {
  from?: string
  to?: string
  shift?: CashierShift
}): Promise<CashierSummary[]> {
  await delay()
  return CASHIERS_BASE.filter(
    (base) => !params?.shift || base.shift === params.shift,
  ).map((base) => {
    let txs = ALL_CASHIER_TX.filter(
      (t) =>
        t.cashierId === base.id && inYmdRange(t.createdAt, params?.from, params?.to),
    )
    if (params?.shift) {
      txs = txs.filter((t) => t.shift === params.shift)
    }
    return {
      ...base,
      totalSales: txs.reduce((s, t) => s + t.amount, 0),
      transactionCount: txs.length,
    }
  })
}

export async function dummyGetCashierTransactions(
  cashierId: string,
  params: {
    page: number
    page_size: number
    from?: string
    to?: string
    cashpoint?: string
    shift?: CashierShift
    from_datetime?: string
    to_datetime?: string
  },
): Promise<PaginatedCashierTransactions> {
  await delay()
  let rows = ALL_CASHIER_TX.filter((t) => t.cashierId === cashierId)
  rows = rows.filter((t) => inYmdRange(t.createdAt, params.from, params.to))
  rows = rows.filter((t) =>
    inDatetimeRange(t.createdAt, params.from_datetime, params.to_datetime),
  )
  if (params.cashpoint) {
    rows = rows.filter((t) => t.cashpointId === params.cashpoint)
  }
  if (params.shift) {
    rows = rows.filter((t) => t.shift === params.shift)
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const filtered_volume = rows.reduce((s, t) => s + t.amount, 0)
  const { data, total, total_pages } = paginate(rows, params.page, params.page_size)
  return {
    data,
    page: params.page,
    page_size: params.page_size,
    total,
    total_pages,
    filtered_volume,
  }
}

export async function dummyGetLossTickets(params: {
  page: number
  page_size: number
  search?: string
  from?: string
  to?: string
}): Promise<PaginatedLossTickets> {
  await delay()
  const q = params.search?.toLowerCase() ?? ''
  let rows = DUMMY_LOSS_TICKETS.filter((t) => inYmdRange(t.createdAt, params.from, params.to))
  if (q) {
    rows = rows.filter(
      (t) =>
        t.reference.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        (t.lossReason ?? '').toLowerCase().includes(q),
    )
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const { data, total, total_pages } = paginate(rows, params.page, params.page_size)
  return {
    data,
    page: params.page,
    page_size: params.page_size,
    total,
    total_pages,
  }
}
