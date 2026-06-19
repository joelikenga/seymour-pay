const STORAGE_KEY = 'pay:admin:transaction-cashiers:v1'

export type TransactionCashiersCache = {
  from: string
  to: string
  names: string[]
  updatedAt: string
}

function readRaw(): TransactionCashiersCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (typeof o.from !== 'string' || typeof o.to !== 'string') return null
    if (!Array.isArray(o.names)) return null
    const names = o.names.filter((n): n is string => typeof n === 'string')
    return {
      from: o.from,
      to: o.to,
      names,
      updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : '',
    }
  } catch {
    return null
  }
}

export function readTransactionCashiersCache(): TransactionCashiersCache | null {
  return readRaw()
}

export function writeTransactionCashiersCache(
  cache: TransactionCashiersCache,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* quota / private mode */
  }
}

export function readTransactionCashiersForRange(
  from: string,
  to: string,
): string[] | undefined {
  const cached = readRaw()
  if (!cached) return undefined
  if (cached.from !== from || cached.to !== to) return undefined
  return cached.names
}

export function readTransactionCashiersCacheUpdatedAt(
  from: string,
  to: string,
): number | undefined {
  const cached = readRaw()
  if (!cached || cached.from !== from || cached.to !== to) return undefined
  if (!cached.updatedAt) return undefined
  const t = Date.parse(cached.updatedAt)
  return Number.isFinite(t) ? t : undefined
}
