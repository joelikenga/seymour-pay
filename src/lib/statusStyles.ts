import type { TransactionStatus } from '../types/transaction'

export const statusPillClass: Record<TransactionStatus, string> = {
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
  pending: 'bg-amber-50 text-amber-900 ring-amber-600/15',
  failed: 'bg-red-50 text-red-800 ring-red-600/15',
  reconciled: 'bg-indigo-50 text-indigo-900 ring-indigo-600/15',
}
