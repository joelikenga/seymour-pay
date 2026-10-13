import type { PaymentChannel, Transaction } from '../types/transaction'
import type { CashierAccount } from '../types/cashierAccount'

export type { CashierAccount }

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

/** Returns locally saved cashier accounts, filtering out any legacy mock accounts. */
export function getCashierAccounts(): CashierAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      // Filter out any lingering mock accounts like Ada, Kunle, etc.
      return (parsed as CashierAccount[]).filter(
        (c) =>
          c &&
          typeof c === 'object' &&
          !['csh-001', 'csh-002', 'csh-003', 'csh-004'].includes(c.id) &&
          !['ada', 'kunle', 'fatima', 'chidi'].includes((c.username || '').toLowerCase()),
      )
    }
    return []
  } catch {
    return []
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
