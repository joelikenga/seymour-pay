import type { Transaction } from '../types/transaction'

/** Matches admin transaction search by ticket ID (`reference`) only. */
export function transactionMatchesSearch(
  row: Pick<Transaction, 'reference'>,
  search: string,
): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return row.reference.toLowerCase().includes(q)
}

export function filterTransactionsBySearch<T extends Pick<Transaction, 'reference'>>(
  rows: T[],
  search: string,
): T[] {
  const q = search.trim()
  if (!q) return rows
  return rows.filter((row) => transactionMatchesSearch(row, q))
}
