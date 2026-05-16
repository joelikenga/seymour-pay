import type {
  CashierSummary,
  CashierTransaction,
  Cashpoint,
  LossTicketRow,
} from '../types/reconciliation'
import { parseCashierShift, shiftFromIso } from './cashierShift'
import { normalizeTransactionRow } from './normalizeTransaction'

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const x = Number(v)
    if (Number.isFinite(x)) return x
  }
  return fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function unwrapEnvelope(raw: unknown): unknown {
  const o = asRecord(raw)
  if (!o || !('data' in o)) return raw
  const inner = o.data
  return inner && typeof inner === 'object' ? inner : raw
}

export function normalizeCashpoint(raw: unknown): Cashpoint | null {
  const o = asRecord(raw)
  if (!o) return null
  const id = str(o.id)
  const name = str(o.name ?? o.label)
  if (!id || !name) return null
  return { id, name }
}

export function normalizeCashierSummary(raw: unknown): CashierSummary | null {
  const o = asRecord(raw)
  if (!o) return null
  const id = str(o.id ?? o.cashier_id)
  if (!id) return null
  const first = str(o.firstName ?? o.first_name)
  const last = str(o.lastName ?? o.last_name)
  const fullName =
    str(o.displayName ?? o.display_name) ||
    [first, last].filter(Boolean).join(' ') ||
    str(o.email)
  const firstName = first || fullName.trim().split(/\s+/)[0] || fullName
  const displayName = firstName
  const shift =
    parseCashierShift(o.shift ?? o.shift_number) ??
    parseCashierShift(o.assigned_shift) ??
    1
  const cashpointIds = Array.isArray(o.cashpoint_ids)
    ? o.cashpoint_ids.map((x) => str(x)).filter(Boolean)
    : Array.isArray(o.cashpointIds)
      ? o.cashpointIds.map((x) => str(x)).filter(Boolean)
      : []
  return {
    id,
    firstName,
    displayName,
    shift,
    email: str(o.email),
    photoUrl:
      typeof o.photoUrl === 'string'
        ? o.photoUrl
        : typeof o.photo_url === 'string'
          ? o.photo_url
          : null,
    totalSales: num(o.total_sales ?? o.totalSales ?? o.volume),
    transactionCount: num(o.transaction_count ?? o.transactionCount ?? o.count),
    cashpointIds,
  }
}

export function normalizeCashierTransaction(raw: unknown): CashierTransaction | null {
  const base = normalizeTransactionRow(raw)
  if (!base) return null
  const o = asRecord(raw) ?? {}
  const cashierNameRaw = str(o.cashier_name ?? o.cashierName)
  const cashierName =
    cashierNameRaw.trim().split(/\s+/)[0] || cashierNameRaw
  const shift =
    parseCashierShift(o.shift ?? o.shift_number) ?? shiftFromIso(base.createdAt)

  return {
    ...base,
    cashierId: str(o.cashier_id ?? o.cashierId),
    cashierName,
    shift,
    cashpointId: str(o.cashpoint_id ?? o.cashpointId),
    cashpointName: str(o.cashpoint_name ?? o.cashpointName),
  }
}

export function normalizeLossTicketRow(raw: unknown): LossTicketRow | null {
  const base = normalizeTransactionRow(raw)
  if (!base) return null
  const o = asRecord(raw) ?? {}
  return {
    ...base,
    lossReason: str(o.loss_reason ?? o.lossReason) || undefined,
  }
}

export function normalizeCashierList(raw: unknown): CashierSummary[] {
  const body = unwrapEnvelope(raw)
  const list = Array.isArray(body)
    ? body
    : Array.isArray(asRecord(body)?.cashiers)
      ? (asRecord(body)!.cashiers as unknown[])
      : []
  return list
    .map((row) => normalizeCashierSummary(row))
    .filter((x): x is CashierSummary => x != null)
}

export function normalizeCashpointList(raw: unknown): Cashpoint[] {
  const body = unwrapEnvelope(raw)
  const list = Array.isArray(body)
    ? body
    : Array.isArray(asRecord(body)?.cashpoints)
      ? (asRecord(body)!.cashpoints as unknown[])
      : []
  return list
    .map((row) => normalizeCashpoint(row))
    .filter((x): x is Cashpoint => x != null)
}

export function normalizeLossTicketList(raw: unknown): LossTicketRow[] {
  const body = unwrapEnvelope(raw)
  const list = Array.isArray(body)
    ? body
    : Array.isArray(asRecord(body)?.data)
      ? (asRecord(body)!.data as unknown[])
      : []
  return list
    .map((row) => normalizeLossTicketRow(row))
    .filter((x): x is LossTicketRow => x != null)
}
