const STORAGE_KEY = 'pay:transactions:v1'
const MAX_ENTRIES = 10

export type PayTransactionRecord = {
  id: string
  ticketId: string
  amount: number
  currency: string
  paymentRef: string
  paidAt: string
  payMethod: string
}

function readRaw(): PayTransactionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is PayTransactionRecord =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as PayTransactionRecord).id === 'string' &&
        typeof (x as PayTransactionRecord).ticketId === 'string' &&
        typeof (x as PayTransactionRecord).paymentRef === 'string' &&
        typeof (x as PayTransactionRecord).paidAt === 'string',
    )
  } catch {
    return []
  }
}

export function loadPayTransactions(): PayTransactionRecord[] {
  return readRaw()
}

export function appendPayTransaction(
  entry: Omit<PayTransactionRecord, 'id'>,
): void {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
  const next: PayTransactionRecord[] = [
    { ...entry, id },
    ...readRaw().filter((e) => e.paymentRef !== entry.paymentRef),
  ].slice(0, MAX_ENTRIES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearPayTransactions(): void {
  localStorage.removeItem(STORAGE_KEY)
}
