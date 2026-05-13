import type { PaymentChannel } from '../types/transaction'

/** Display order: All types card is separate; these are the five rails. */
export const PAYMENT_CHANNELS: PaymentChannel[] = [
  'cash',
  'pos',
  'transfer',
  'epayment',
  'ussd',
]

/** POS, transfer, e-payment & USSD are cleared via Fidelity as pay provider; cash is booth-side. */
export function usesFidelityPayRail(channel: PaymentChannel): boolean {
  return channel !== 'cash'
}

export const channelLabel: Record<PaymentChannel, string> = {
  cash: 'Cash',
  pos: 'POS',
  transfer: 'Transfer',
  epayment: 'E-payment',
  ussd: 'USSD',
}

export const channelPillClass: Record<PaymentChannel, string> = {
  cash: 'bg-emerald-50 text-emerald-900 ring-emerald-600/15',
  pos: 'bg-orange-50 text-orange-900 ring-orange-600/15',
  transfer: 'bg-sky-50 text-sky-900 ring-sky-600/15',
  epayment: 'bg-violet-50 text-violet-900 ring-violet-600/15',
  ussd: 'bg-teal-50 text-teal-900 ring-teal-600/15',
}

export const channelChartHex: Record<PaymentChannel, string> = {
  cash: '#22c55e',
  pos: '#eab308',
  transfer: '#0ea5e9',
  epayment: '#8b5cf6',
  ussd: '#14b8a6',
}
