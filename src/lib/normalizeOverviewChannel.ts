import type { PaymentChannel } from '../types/transaction'
import { normalizePaymentChannel } from './normalizeTransaction'

/** Empty string when the API sends `"channel": ""` (e.g. pending / unassigned). */
export type OverviewChannel = PaymentChannel | ''

/** Coerce overview `channel_breakdown` channel values (preserves blank / pending rows). */
export function normalizeOverviewChannel(raw: unknown): OverviewChannel {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (!s) return ''
  return normalizePaymentChannel(raw)
}

export function isKnownPaymentChannel(
  channel: OverviewChannel,
): channel is PaymentChannel {
  return channel !== ''
}
