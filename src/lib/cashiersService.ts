import type { PaymentChannel, Transaction } from '../types/transaction'
import type { CashierTransaction } from '../types/reconciliation'
import { ALL_CASHIER_TX } from '../data/reconciliationDummyData'

export interface CashierAccount {
  id: string
  username: string
  password: string
  shift: 'morning' | 'night'
  createdAt: string
  name?: string
  status?: 'active' | 'inactive'
  notes?: string
}

export interface CashierChannelTotals {
  volume: number
  count: number
  sharePct: number
}

export interface CashierSalesSummary {
  cash: CashierChannelTotals
  pos: CashierChannelTotals
  transfer: CashierChannelTotals
  ussd: CashierChannelTotals
  epayment: CashierChannelTotals
  grandVolume: number
  totalCount: number
}

const STORAGE_KEY = 'pay:admin:cashier-accounts:v2'

const DEFAULT_CASHIERS: CashierAccount[] = [
  {
    id: 'csh-001',
    username: 'Ada',
    password: 'Password@2026!',
    shift: 'morning',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'csh-002',
    username: 'Kunle',
    password: 'Password@2026!',
    shift: 'morning',
    createdAt: '2026-09-05T08:30:00Z',
  },
  {
    id: 'csh-003',
    username: 'Fatima',
    password: 'Password@2026!',
    shift: 'night',
    createdAt: '2026-09-10T20:00:00Z',
  },
  {
    id: 'csh-004',
    username: 'Chidi',
    password: 'Password@2026!',
    shift: 'night',
    createdAt: '2026-09-12T20:15:00Z',
  },
]

export function generateCashierUsername(name?: string): string {
  const randomSuffix = Math.floor(10 + Math.random() * 90)
  if (name && name.trim()) {
    const clean = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 12)
    return `csh_${clean}_${randomSuffix}`
  }
  const adjectives = ['swift', 'fast', 'pro', 'park', 'pay', 'gate']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  return `cashier_${adj}_${randomSuffix}`
}

export function generateCashierPassword(): string {
  const prefixes = ['Seymour', 'Cashier', 'ParkPay', 'Aviation', 'GatePass']
  const symbols = ['@', '#', '$', '!', '&']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${symbol}${num}`
}

export function getCashierAccounts(): CashierAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CASHIERS))
      return DEFAULT_CASHIERS
    }
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as CashierAccount[]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CASHIERS))
    return DEFAULT_CASHIERS
  } catch {
    return DEFAULT_CASHIERS
  }
}

export function getCashierAccountById(id: string): CashierAccount | undefined {
  const cashiers = getCashierAccounts()
  return cashiers.find((c) => c.id === id || c.username.toLowerCase() === id.toLowerCase())
}

export function createCashierAccount(
  data: Omit<CashierAccount, 'id' | 'createdAt'>,
): CashierAccount {
  const accounts = getCashierAccounts()
  const newAccount: CashierAccount = {
    ...data,
    id: `csh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  }
  const updated = [newAccount, ...accounts]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // storage error
  }
  return newAccount
}

export function deleteCashierAccount(id: string): boolean {
  const accounts = getCashierAccounts()
  const updated = accounts.filter((c) => c.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // storage error
  }
  return updated.length < accounts.length
}

export function computeSalesSummary(transactions: Transaction[]): CashierSalesSummary {
  const channelTotals: Record<PaymentChannel, { volume: number; count: number }> = {
    cash: { volume: 0, count: 0 },
    pos: { volume: 0, count: 0 },
    transfer: { volume: 0, count: 0 },
    ussd: { volume: 0, count: 0 },
    epayment: { volume: 0, count: 0 },
  }

  let grandVolume = 0
  let totalCount = 0

  for (const t of transactions) {
    const ch = t.channel in channelTotals ? t.channel : 'cash'
    channelTotals[ch].volume += t.amount
    channelTotals[ch].count += 1
    grandVolume += t.amount
    totalCount += 1
  }

  function bundle(ch: PaymentChannel): CashierChannelTotals {
    const { volume, count } = channelTotals[ch]
    const sharePct = grandVolume > 0 ? (volume / grandVolume) * 100 : 0
    return { volume, count, sharePct }
  }

  return {
    cash: bundle('cash'),
    pos: bundle('pos'),
    transfer: bundle('transfer'),
    ussd: bundle('ussd'),
    epayment: bundle('epayment'),
    grandVolume,
    totalCount,
  }
}

/** Converts reconciliation dummy cashier transactions to standard Transaction rows for fallback. */
export function getMockTransactionsForCashier(
  cashierUsername: string,
  fromDate?: string,
  toDate?: string,
): Transaction[] {
  const normalizedUser = cashierUsername.toLowerCase().trim()
  const matching = ALL_CASHIER_TX.filter((tx: CashierTransaction) => {
    const matchesUser =
      (tx.createdBy || '').toLowerCase() === normalizedUser ||
      (tx.cashierName || '').toLowerCase() === normalizedUser ||
      (tx.cashierId || '').toLowerCase().includes(normalizedUser)

    if (!matchesUser) return false

    if (fromDate && tx.createdAt < fromDate) return false
    if (toDate && tx.createdAt > toDate) return false
    return true
  })

  return matching.map((m: CashierTransaction): Transaction => ({
    id: m.id,
    reference: m.reference || m.ticketId || m.id,
    ticketId: m.ticketId || m.reference || m.id,
    code: m.code || '',
    customerName: m.customerName || m.cashierName,
    amount: m.amount,
    channel: m.channel,
    vehicleType: m.vehicleType,
    status: m.status || 'completed',
    createdAt: m.createdAt,
    notes: m.notes || `Shift: ${m.shift} | Terminal: ${m.cashpointId}`,
    isLostTicket: m.isLostTicket ?? false,
    carfeeId: m.carfeeId || m.id,
    createdBy: m.createdBy || m.cashierName,
    entryTime: m.entryTime,
    exitTime: m.exitTime,
  }))
}
