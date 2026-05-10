import type { Transaction } from '../types/transaction'
import { channelLabel } from './channelStyles'
import { formatDateShort, formatMoney } from './formatters'
import { vehicleLabel } from './vehicleStyles'

/**
 * Audit-log copy for transaction edits: includes formatted amounts (₦) and
 * labels, not only field names. When `serverRow` is set (normalized PATCH
 * response), amount uses the server value as the “after” figure.
 */
export function describeTransactionPatchForLog(
  prev: Transaction,
  patch: Partial<Transaction>,
  serverRow?: Transaction | null,
): string {
  const parts: string[] = []

  if (patch.amount !== undefined) {
    const after = serverRow?.amount ?? patch.amount
    parts.push(`amount ${formatMoney(prev.amount)} → ${formatMoney(after)}`)
  }

  if (patch.channel !== undefined && patch.channel !== prev.channel) {
    parts.push(
      `channel ${channelLabel[prev.channel]} → ${channelLabel[patch.channel]}`,
    )
  }

  if (
    patch.vehicleType !== undefined &&
    patch.vehicleType !== prev.vehicleType
  ) {
    parts.push(
      `vehicle ${vehicleLabel[prev.vehicleType]} → ${vehicleLabel[patch.vehicleType]}`,
    )
  }

  if (patch.status !== undefined && patch.status !== prev.status) {
    parts.push(`status ${prev.status} → ${patch.status}`)
  }

  if (patch.createdAt !== undefined && patch.createdAt !== prev.createdAt) {
    parts.push(
      `date ${formatDateShort(prev.createdAt)} → ${formatDateShort(patch.createdAt)}`,
    )
  }

  if (
    patch.customerName !== undefined &&
    patch.customerName !== prev.customerName
  ) {
    parts.push(
      `customer "${prev.customerName}" → "${patch.customerName}"`,
    )
  }

  if (patch.notes !== undefined && patch.notes !== prev.notes) {
    parts.push('notes updated')
  }

  if (patch.reference !== undefined && patch.reference !== prev.reference) {
    parts.push(`reference ${prev.reference} → ${patch.reference}`)
  }

  return parts.length > 0 ? parts.join('; ') : 'saved'
}
