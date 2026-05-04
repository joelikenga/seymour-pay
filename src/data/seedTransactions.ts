import type {
  PaymentChannel,
  Transaction,
  TransactionStatus,
  VehicleType,
} from '../types/transaction'
import { PAYMENT_CHANNELS } from '../lib/channelStyles'
import { VEHICLE_TYPES } from '../lib/vehicleStyles'

const channels: PaymentChannel[] = [...PAYMENT_CHANNELS]

const statuses: TransactionStatus[] = [
  'completed',
  'completed',
  'completed',
  'reconciled',
  'pending',
  'failed',
]

const customers = [
  'Acme Ltd',
  'Jet Logistics',
  'Sky Cargo',
  'Travel Hub',
  'Charter Co.',
  'Northwind Trading',
  'Blue Ridge Finance',
  'Falcon Express',
  'Aero Connect',
  'Greenline Tours',
] as const

/** Deterministic 32-bit PRNG so the demo state is stable across reloads/builds. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickWeighted<T>(rand: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, w) => a + w, 0)
  let r = rand() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function amountFor(channel: PaymentChannel, rand: () => number): number {
  const base = (() => {
    switch (channel) {
      case 'cash':
        return 4000 + Math.floor(rand() * 8000)
      case 'pos':
        return 7500 + Math.floor(rand() * 18000)
      case 'transfer':
        return 9000 + Math.floor(rand() * 22000)
      case 'epayment':
        return 6000 + Math.floor(rand() * 16000)
      case 'ussd':
        return 1500 + Math.floor(rand() * 5000)
    }
  })()
  // Round to nearest 100 NGN for a tidy ledger feel.
  return Math.round(base / 100) * 100
}

/**
 * Demo ledger: ~365 days of transactions with strong day-to-day variability
 * (1-7 records per day, channel mix flips each day, zig-zag friendly).
 * Deterministic via a seeded PRNG.
 */
export function createSeedTransactions(): Transaction[] {
  const rand = mulberry32(0xc0ffee)
  const out: Transaction[] = []

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  // 365 days of history so the monthly chart has 12 months of data.
  for (let dayOffset = 364; dayOffset >= 0; dayOffset--) {
    const date = new Date(today)
    date.setDate(today.getDate() - dayOffset)
    date.setHours(0, 0, 0, 0)

    // Bigger swings near the present (more recent activity), still random.
    const recencyBoost = dayOffset < 30 ? 1 : dayOffset < 90 ? 0.7 : 0.45
    const dailyMax = Math.max(1, Math.round(7 * recencyBoost))
    const dayCount = 1 + Math.floor(rand() * dailyMax)

    // Pick 1-2 dominant channels for the day so per-rail counts zig-zag.
    const dom1 = channels[Math.floor(rand() * channels.length)]
    const dom2 = channels[Math.floor(rand() * channels.length)]
    const weights = channels.map((c) =>
      c === dom1 ? 4.5 : c === dom2 ? 2.2 : 0.8,
    )

    for (let i = 0; i < dayCount; i++) {
      const ch = pickWeighted(rand, channels, weights)
      const vehicleType: VehicleType =
        VEHICLE_TYPES[Math.floor(rand() * VEHICLE_TYPES.length)]
      const status = statuses[Math.floor(rand() * statuses.length)]

      const hour = 7 + Math.floor(rand() * 14) // 07:00 — 20:59
      const minute = Math.floor(rand() * 60)
      const second = Math.floor(rand() * 60)
      const d = new Date(date)
      d.setHours(hour, minute, second, 0)

      const amount = amountFor(ch, rand)
      const refSeq = String(out.length + 1).padStart(4, '0')
      const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

      out.push({
        id: `tx-${1000 + out.length}`,
        reference: `REF-${yyyymmdd}-${refSeq}`,
        amount,
        channel: ch,
        vehicleType,
        status,
        createdAt: d.toISOString(),
        customerName: customers[Math.floor(rand() * customers.length)],
        notes:
          rand() < 0.12
            ? 'Bulk settlement batch'
            : rand() < 0.06
              ? 'Customer dispute pending'
              : '',
      })
    }
  }

  return out.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export const seedTransactions: Transaction[] = createSeedTransactions()
