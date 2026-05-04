import type { AuditLogEntry } from '../types/auditLog'
import { usesFidelityPayRail } from './channelStyles'
import type {
  PaymentChannel,
  Transaction,
  TransactionStatus,
  VehicleType,
} from '../types/transaction'

export function totalVolume(rows: Transaction[]): number {
  return rows.reduce((a, t) => a + t.amount, 0)
}

/** Last `days` days, oldest first (for sparkline). */
export function dailyVolumeSeries(rows: Transaction[], days: number): number[] {
  const now = new Date()
  const out: number[] = []
  for (let d = days - 1; d >= 0; d--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - d)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    const sum = rows
      .filter((t) => {
        const x = new Date(t.createdAt).getTime()
        return x >= dayStart.getTime() && x <= dayEnd.getTime()
      })
      .reduce((a, t) => a + t.amount, 0)
    out.push(sum)
  }
  return out
}

/** Sum of amounts for transactions in [startDaysAgoEnd, endDaysAgoEnd] window (inclusive days). */
export function volumeInRollingWindow(
  rows: Transaction[],
  endDaysAgo: number,
  windowDays: number,
): number {
  const end = new Date()
  end.setDate(end.getDate() - endDaysAgo)
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - (windowDays - 1))
  start.setHours(0, 0, 0, 0)
  return rows
    .filter((t) => {
      const x = new Date(t.createdAt).getTime()
      return x >= start.getTime() && x <= end.getTime()
    })
    .reduce((a, t) => a + t.amount, 0)
}

export function pctChangeWeekOverWeek(rows: Transaction[]): number | null {
  const last7 = volumeInRollingWindow(rows, 0, 7)
  const prev7 = volumeInRollingWindow(rows, 7, 7)
  if (prev7 === 0) return last7 > 0 ? 100 : null
  return ((last7 - prev7) / prev7) * 100
}

export function activeChannelCount(rows: Transaction[]): number {
  return new Set(rows.map((t) => t.channel)).size
}

export function volumeByStatus(
  rows: Transaction[],
): Record<TransactionStatus, { count: number; volume: number }> {
  const init: Record<TransactionStatus, { count: number; volume: number }> = {
    completed: { count: 0, volume: 0 },
    pending: { count: 0, volume: 0 },
    failed: { count: 0, volume: 0 },
    reconciled: { count: 0, volume: 0 },
  }
  for (const t of rows) {
    const b = init[t.status]
    b.count += 1
    b.volume += t.amount
  }
  return init
}

export function topChannelsByVolume(
  rows: Transaction[],
  limit = 3,
): { channel: PaymentChannel; volume: number }[] {
  const map = new Map<PaymentChannel, number>()
  for (const t of rows) {
    map.set(t.channel, (map.get(t.channel) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([channel, volume]) => ({ channel, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
}

/** Volume ranked by vehicle classification (car park reporting). */
export function topVehicleTypesByVolume(
  rows: Transaction[],
  limit = 5,
): { vehicleType: VehicleType; volume: number }[] {
  const map = new Map<VehicleType, number>()
  for (const t of rows) {
    map.set(t.vehicleType, (map.get(t.vehicleType) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([vehicleType, volume]) => ({ vehicleType, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
}

/** Sum volume for transactions whose local calendar day (Lagos / WAT) is “today”. */
function isLagosCalendarToday(iso: string, todayYmd: string): boolean {
  const ymd = lagosYmd(iso)
  return ymd === todayYmd
}

/** YYYY-MM-DD for a date in the Lagos calendar (en-CA gives ISO format). */
function lagosYmd(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    timeZone: 'Africa/Lagos',
  })
}

function todayLagosYmd(): string {
  return lagosYmd(new Date())
}

/** Build a JS Date at local midnight from a YMD string (used purely for date math). */
function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function localDateToYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export interface YmdRange {
  /** Inclusive YYYY-MM-DD start (Lagos calendar). */
  start: string
  /** Inclusive YYYY-MM-DD end (Lagos calendar). */
  end: string
}

/** Sum volume for transactions whose calendar day in Lagos is today. */
export function todayVolume(rows: Transaction[]): number {
  const today = todayLagosYmd()
  return rows
    .filter((t) => isLagosCalendarToday(t.createdAt, today))
    .reduce((a, t) => a + t.amount, 0)
}

/** Count of transactions posted on today’s Lagos calendar day. */
export function todayTransactionCount(rows: Transaction[]): number {
  const today = todayLagosYmd()
  return rows.filter((t) => isLagosCalendarToday(t.createdAt, today)).length
}

/** Sum volume for transactions posted on yesterday’s Lagos calendar day. */
export function yesterdayVolume(rows: Transaction[]): number {
  const today = ymdToLocalDate(todayLagosYmd())
  today.setDate(today.getDate() - 1)
  const ymd = localDateToYmd(today)
  return rows
    .filter((t) => lagosYmd(t.createdAt) === ymd)
    .reduce((a, t) => a + t.amount, 0)
}

/** Lagos YMD for yesterday. */
export function yesterdayLagosYmd(): string {
  const d = ymdToLocalDate(todayLagosYmd())
  d.setDate(d.getDate() - 1)
  return localDateToYmd(d)
}

/** Lagos YMD for today. */
export function todayYmd(): string {
  return todayLagosYmd()
}

/** Monday-anchored ISO week so far: start of week (Mon) → today (Lagos). */
export function weekToDateRange(): YmdRange {
  const today = ymdToLocalDate(todayLagosYmd())
  const dow = today.getDay() // 0 = Sun … 6 = Sat
  const sinceMonday = (dow + 6) % 7
  const start = new Date(today)
  start.setDate(start.getDate() - sinceMonday)
  return { start: localDateToYmd(start), end: localDateToYmd(today) }
}

/** Calendar month so far: 1st of month → today (Lagos). */
export function monthToDateRange(): YmdRange {
  const today = ymdToLocalDate(todayLagosYmd())
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  return { start: localDateToYmd(start), end: localDateToYmd(today) }
}

/** Sum volume for transactions whose Lagos calendar day falls within the (inclusive) range. */
export function volumeInYmdRange(rows: Transaction[], range: YmdRange): number {
  return rows
    .filter((t) => {
      const ymd = lagosYmd(t.createdAt)
      return ymd >= range.start && ymd <= range.end
    })
    .reduce((a, t) => a + t.amount, 0)
}

export interface MonthBucket {
  key: string
  label: string
  volume: number
}

/**
 * Customer traffic per calendar month for a given year (Jan → Dec).
 * Each transaction = one car-park visit, so the count proxies daily customer footfall.
 */
export function customerTrafficByMonth(
  rows: Transaction[],
  year: number = new Date().getFullYear(),
): { label: string; key: string; count: number }[] {
  const labels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return labels.map((label, idx) => {
    const count = rows.filter((t) => {
      const d = new Date(t.createdAt)
      return d.getFullYear() === year && d.getMonth() === idx
    }).length
    return { label, key: `${year}-${String(idx + 1).padStart(2, '0')}`, count }
  })
}

/** Calendar months, oldest first, last `months` including current. */
export function monthlyVolume(rows: Transaction[], months = 6): MonthBucket[] {
  const out: MonthBucket[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const start = new Date(y, m, 1, 0, 0, 0, 0)
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
    const key = `${y}-${String(m + 1).padStart(2, '0')}`
    const label = d.toLocaleString(undefined, { month: 'short' })
    const volume = rows
      .filter((t) => {
        const x = new Date(t.createdAt).getTime()
        return x >= start.getTime() && x <= end.getTime()
      })
      .reduce((a, t) => a + t.amount, 0)
    out.push({ key, label, volume })
  }
  return out
}

export function settledVolume(rows: Transaction[]): number {
  return rows
    .filter((t) => t.status === 'completed' || t.status === 'reconciled')
    .reduce((a, t) => a + t.amount, 0)
}

export function pipelineVolume(rows: Transaction[]): number {
  return rows
    .filter((t) => t.status === 'pending' || t.status === 'failed')
    .reduce((a, t) => a + t.amount, 0)
}

/**
 * Fidelity-switched volume: every rail except cash (POS, transfer, e-payment, USSD).
 * Completed + reconciled share reflects pay-provider clearance.
 */
export function fidelityPayRailStats(rows: Transaction[]): {
  volume: number
  count: number
  successPct: number | null
} {
  const routed = rows.filter((t) => usesFidelityPayRail(t.channel))
  const volume = routed.reduce((a, t) => a + t.amount, 0)
  const count = routed.length
  const settled = routed.filter(
    (t) => t.status === 'completed' || t.status === 'reconciled',
  ).length
  const successPct = count > 0 ? Math.round((settled / count) * 100) : null
  return { volume, count, successPct }
}

/** Share each of the 4 Fidelity rails (POS, transfer, e-payment, USSD) takes of pay-rail traffic. */
export function fidelityChannelMix(rows: Transaction[]): {
  channel: PaymentChannel
  count: number
  pct: number
}[] {
  const order: PaymentChannel[] = ['pos', 'transfer', 'epayment', 'ussd']
  const routed = rows.filter((t) => usesFidelityPayRail(t.channel))
  const total = routed.length
  return order.map((c) => {
    const count = routed.filter((t) => t.channel === c).length
    const pct = total > 0 ? (count / total) * 100 : 0
    return { channel: c, count, pct }
  })
}

/** Fixed display order for the four Fidelity-routed rails. */
export const FIDELITY_RAILS: PaymentChannel[] = [
  'pos',
  'transfer',
  'epayment',
  'ussd',
]

/** Count of TODAY (Lagos calendar) transactions per Fidelity rail. */
export function todayChannelCounts(
  rows: Transaction[],
): { channel: PaymentChannel; count: number }[] {
  const today = todayLagosYmd()
  return FIDELITY_RAILS.map((channel) => ({
    channel,
    count: rows.filter(
      (t) => t.channel === channel && lagosYmd(t.createdAt) === today,
    ).length,
  }))
}

/** One row per weekday for the current ISO week (Mon → Sun) with per-rail counts. */
export function weekdayChannelCounts(
  rows: Transaction[],
): Array<{ label: string } & Record<PaymentChannel, number>> {
  const today = ymdToLocalDate(todayLagosYmd())
  const dow = today.getDay()
  const sinceMonday = (dow + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - sinceMonday)

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const out: Array<{ label: string } & Record<PaymentChannel, number>> = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const ymd = localDateToYmd(d)
    const row = { label: labels[i] } as { label: string } & Record<
      PaymentChannel,
      number
    >
    for (const c of FIDELITY_RAILS) {
      row[c] = rows.filter(
        (t) => t.channel === c && lagosYmd(t.createdAt) === ymd,
      ).length
    }
    // Other rails default to 0 so the type is satisfied for the chart.
    row.cash = 0
    out.push(row)
  }
  return out
}

/**
 * One row per calendar month for a given year (Jan → Dec) with per-rail counts.
 * Defaults to the current calendar year. Months without traffic appear as 0.
 */
export function monthlyChannelCounts(
  rows: Transaction[],
  year: number = new Date().getFullYear(),
): Array<{ label: string; key: string; year: number } & Record<PaymentChannel, number>> {
  const labels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return labels.map((label, idx) => {
    const key = `${year}-${String(idx + 1).padStart(2, '0')}`
    const row = { label, key, year } as {
      label: string
      key: string
      year: number
    } & Record<PaymentChannel, number>
    for (const c of FIDELITY_RAILS) {
      row[c] = rows.filter((t) => {
        if (t.channel !== c) return false
        const tx = new Date(t.createdAt)
        return tx.getFullYear() === year && tx.getMonth() === idx
      }).length
    }
    row.cash = 0
    return row
  })
}

/** Derived backend / network signals from ledger + audit trail (demo-grade). */
export function backendNetworkHealth(
  transactions: Transaction[],
  logs: AuditLogEntry[],
): {
  status: 'operational' | 'degraded'
  headline: string
  p95Ms: number
  auditEvents24h: number
} {
  const now = Date.now()
  const ms24 = 24 * 60 * 60 * 1000
  const auditEvents24h = logs.filter(
    (l) => now - new Date(l.at).getTime() <= ms24,
  ).length

  const n = transactions.length
  const failed = transactions.filter((t) => t.status === 'failed').length
  const failRate = n > 0 ? failed / n : 0
  const status: 'operational' | 'degraded' =
    failRate > 0.12 || failed >= 4 ? 'degraded' : 'operational'

  const base = 72 + (n % 55) + (auditEvents24h % 33)
  const p95Ms = Math.min(320, Math.max(68, base))

  const headline =
    status === 'operational'
      ? 'API & webhooks within SLO'
      : 'Check pending settlements'

  return { status, headline, p95Ms, auditEvents24h }
}
