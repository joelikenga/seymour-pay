import type { CashierSummary } from '../types/reconciliation'

export function cashierFirstName(
  cashier: Pick<CashierSummary, 'firstName' | 'displayName'>,
): string {
  const first = cashier.firstName?.trim()
  if (first) return first
  const fromDisplay = cashier.displayName.trim().split(/\s+/)[0]
  return fromDisplay || cashier.displayName
}
