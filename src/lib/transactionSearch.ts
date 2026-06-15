import type { Transaction } from '../types/transaction'

/** Matches admin transaction search by ticket ID (`ticketId`, then `reference`). */
export function transactionMatchesSearch(
  row: Pick<Transaction, 'ticketId' | 'reference'>,
  search: string,
): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  const ticketId = row.ticketId.trim().toLowerCase()
  const reference = row.reference.trim().toLowerCase()
  return ticketId.includes(q) || reference.includes(q)
}

export function filterTransactionsBySearch<T extends Pick<Transaction, 'ticketId' | 'reference'>>(
  rows: T[],
  search: string,
): T[] {
  const q = search.trim()
  if (!q) return rows
  return rows.filter((row) => transactionMatchesSearch(row, q))
}
