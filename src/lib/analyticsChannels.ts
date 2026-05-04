import type { PaymentChannel, Transaction } from '../types/transaction'

export function rowsForChannel(
  rows: Transaction[],
  channel: PaymentChannel,
): Transaction[] {
  return rows.filter((t) => t.channel === channel)
}

/** One row per day with per-channel amounts (for overlaid multi-series charts). */
export function dailyVolumeAllChannels(
  rows: Transaction[],
  channels: readonly PaymentChannel[],
  days = 14,
): Array<{ label: string } & Record<PaymentChannel, number>> {
  const now = new Date()
  const result: Array<{ label: string } & Record<PaymentChannel, number>> = []

  for (let d = days - 1; d >= 0; d--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - d)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const row = { label: `${dayStart.getMonth() + 1}/${dayStart.getDate()}` } as {
      label: string
    } & Record<PaymentChannel, number>

    for (const ch of channels) {
      const sum = rows
        .filter((t) => {
          if (t.channel !== ch) return false
          const x = new Date(t.createdAt).getTime()
          return x >= dayStart.getTime() && x <= dayEnd.getTime()
        })
        .reduce((a, t) => a + t.amount, 0)
      row[ch] = sum
    }
    result.push(row)
  }
  return result
}

export function dailyVolumeByChannel(
  rows: Transaction[],
  channel: PaymentChannel,
  days = 14,
): { label: string; amount: number }[] {
  const slice = rowsForChannel(rows, channel)
  const out: { label: string; amount: number }[] = []
  const now = new Date()

  for (let d = days - 1; d >= 0; d--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - d)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const sum = slice
      .filter((t) => {
        const x = new Date(t.createdAt).getTime()
        return x >= dayStart.getTime() && x <= dayEnd.getTime()
      })
      .reduce((a, t) => a + t.amount, 0)

    out.push({
      label: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
      amount: sum,
    })
  }
  return out
}

export function statusCountsForChannel(
  rows: Transaction[],
  channel: PaymentChannel,
): { status: Transaction['status']; count: number }[] {
  const slice = rowsForChannel(rows, channel)
  const map = new Map<Transaction['status'], number>()
  for (const t of slice) {
    map.set(t.status, (map.get(t.status) ?? 0) + 1)
  }
  return [...map.entries()].map(([status, count]) => ({ status, count }))
}

export function rankedCustomersForChannel(
  rows: Transaction[],
  channel: PaymentChannel,
): { name: string; amount: number }[] {
  const slice = rowsForChannel(rows, channel)
  const map = new Map<string, number>()
  for (const t of slice) {
    map.set(t.customerName, (map.get(t.customerName) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}
