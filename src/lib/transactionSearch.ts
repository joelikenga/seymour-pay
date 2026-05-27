import type { Transaction } from '../types/transaction'

/** Matches admin transaction search (ticket ID, customer, notes, internal id). */
export function transactionMatchesSearch(
  row: Pick<Transaction, 'reference' | 'customerName' | 'notes' | 'id'>,
  search: string,
): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return (
    row.reference.toLowerCase().includes(q) ||
    row.customerName.toLowerCase().includes(q) ||
    (row.notes ?? '').toLowerCase().includes(q) ||
    row.id.toLowerCase().includes(q)
  )
}

export function filterTransactionsBySearch<T extends Pick<
  Transaction,
  'reference' | 'customerName' | 'notes' | 'id'
>>(
  rows: T[],
  search: string,
): T[] {
  const q = search.trim()
  if (!q) return rows
  return rows.filter((row) => transactionMatchesSearch(row, q))
}
