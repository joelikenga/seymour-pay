import type { AuditLogEntry } from '../types/auditLog'
import { PAYMENT_CHANNELS, usesFidelityPayRail } from './channelStyles'
import { formatDayStamp, formatYmdRange } from './formatters'
import { VEHICLE_TYPES } from './vehicleStyles'
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

/** Fixed display order for the four bank-routed channels (no cash). */
export const FIDELITY_RAILS: PaymentChannel[] = [
  'pos',
  'transfer',
  'epayment',
  'ussd',
]

/**
 * Display order for the Overview's channel charts. All five payment types
 * (cash + the four Fidelity-routed channels) so admins see the full picture.
 */
export const OVERVIEW_PAYMENT_TYPES: PaymentChannel[] = [
  'cash',
  'pos',
  'transfer',
  'epayment',
  'ussd',
]

/** Count of TODAY (Lagos calendar) transactions per payment type. */
export function todayChannelCounts(
  rows: Transaction[],
): { channel: PaymentChannel; count: number }[] {
  const today = todayLagosYmd()
  return OVERVIEW_PAYMENT_TYPES.map((channel) => ({
    channel,
    count: rows.filter(
      (t) => t.channel === channel && lagosYmd(t.createdAt) === today,
    ).length,
  }))
}

/** One row per weekday for the current ISO week (Mon → Sun) with per-channel counts. */
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
    for (const c of PAYMENT_CHANNELS) {
      row[c] = rows.filter(
        (t) => t.channel === c && lagosYmd(t.createdAt) === ymd,
      ).length
    }
    out.push(row)
  }
  return out
}

/**
 * One row per calendar month for a given year (Jan → Dec) with per-channel counts.
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
    for (const c of PAYMENT_CHANNELS) {
      row[c] = rows.filter((t) => {
        if (t.channel !== c) return false
        const tx = new Date(t.createdAt)
        return tx.getFullYear() === year && tx.getMonth() === idx
      }).length
    }
    return row
  })
}

/** Rolling calendar window in local time (matches {@link volumeInRollingWindow}). */
function rollingWindowMs(
  endDaysAgo: number,
  windowDays: number,
): { lo: number; hi: number } {
  const end = new Date()
  end.setDate(end.getDate() - endDaysAgo)
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - (windowDays - 1))
  start.setHours(0, 0, 0, 0)
  return { lo: start.getTime(), hi: end.getTime() }
}

/** Seven local calendar days, oldest first — same bounds as {@link dailyVolumeSeries}. */
function localSevenDayBounds(): { lo: number; hi: number }[] {
  const now = new Date()
  const out: { lo: number; hi: number }[] = []
  for (let d = 6; d >= 0; d--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - d)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    out.push({ lo: dayStart.getTime(), hi: dayEnd.getTime() })
  }
  return out
}

const TRAFFIC_MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** Everything the Dashboard overview needs from `transactions`, in a single pass. */
export interface OverviewDashboardStats {
  grand: number
  fidelityMix: { channel: PaymentChannel; count: number; pct: number }[]
  wow: number | null
  totalCount: number
  channelsUsed: number
  /** Volume mix by vehicle class from the dashboard overview API. */
  vehicleBreakdown: { vehicleType: VehicleType; count: number; volume: number }[]
  customerTraffic: { label: string; key: string; count: number }[]
  trafficYear: number
  trafficTotal: number
  today: number
  todaySessions: number
  yesterday: number
  weekToDate: number
  monthToDate: number
  todayLabel: string
  yesterdayLabel: string
  weekLabel: string
  monthLabel: string
  settledVol: number
  pipelineVol: number
  byStatus: Record<TransactionStatus, { count: number; volume: number }>
  avgTicket: number
  settledSharePct: number
  weekSeries: number[]
  weekMax: number
}

/** All-zero overview stats (same labels as computed stats) when analytics API has not loaded yet. */
export function emptyOverviewDashboardStats(): OverviewDashboardStats {
  const weekRange = weekToDateRange()
  const monthRange = monthToDateRange()
  const trafficYear = new Date().getFullYear()
  const byStatus: Record<TransactionStatus, { count: number; volume: number }> = {
    completed: { count: 0, volume: 0 },
    pending: { count: 0, volume: 0 },
    failed: { count: 0, volume: 0 },
    reconciled: { count: 0, volume: 0 },
  }
  const fidelityMix = FIDELITY_RAILS.map((c) => ({ channel: c, count: 0, pct: 0 }))
  const vehicleBreakdown = VEHICLE_TYPES.map((vehicleType) => ({
    vehicleType,
    count: 0,
    volume: 0,
  }))
  const customerTraffic = TRAFFIC_MONTH_LABELS.map((label, idx) => ({
    label,
    key: `${trafficYear}-${String(idx + 1).padStart(2, '0')}`,
    count: 0,
  }))
  const weekSeries = new Array(7).fill(0) as number[]
  return {
    grand: 0,
    fidelityMix,
    wow: null,
    totalCount: 0,
    channelsUsed: 0,
    vehicleBreakdown,
    customerTraffic,
    trafficYear,
    trafficTotal: 0,
    today: 0,
    todaySessions: 0,
    yesterday: 0,
    weekToDate: 0,
    monthToDate: 0,
    todayLabel: formatDayStamp(todayYmd()),
    yesterdayLabel: formatDayStamp(yesterdayLagosYmd()),
    weekLabel: formatYmdRange(weekRange.start, weekRange.end),
    monthLabel: formatYmdRange(monthRange.start, monthRange.end),
    settledVol: 0,
    pipelineVol: 0,
    byStatus,
    avgTicket: 0,
    settledSharePct: 0,
    weekSeries,
    weekMax: Math.max(1, ...weekSeries),
  }
}

export function computeOverviewDashboardStats(
  rows: Transaction[],
): OverviewDashboardStats {
  const byStatus: Record<TransactionStatus, { count: number; volume: number }> = {
    completed: { count: 0, volume: 0 },
    pending: { count: 0, volume: 0 },
    failed: { count: 0, volume: 0 },
    reconciled: { count: 0, volume: 0 },
  }

  const fidelityCounts: {
    pos: number
    transfer: number
    epayment: number
    ussd: number
  } = { pos: 0, transfer: 0, epayment: 0, ussd: 0 }

  const channelsSeen = new Set<PaymentChannel>()
  const trafficYear = new Date().getFullYear()
  const monthCounts = new Array(12).fill(0) as number[]

  const todayY = todayLagosYmd()
  const yesterdayY = yesterdayLagosYmd()
  const weekRange = weekToDateRange()
  const monthRange = monthToDateRange()

  const last7 = rollingWindowMs(0, 7)
  const prev7 = rollingWindowMs(7, 7)
  const dayBounds = localSevenDayBounds()
  const weekSeries = new Array(7).fill(0) as number[]

  let grand = 0
  let today = 0
  let todaySessions = 0
  let yesterday = 0
  let weekToDate = 0
  let monthToDate = 0
  let settledVol = 0
  let pipelineVol = 0
  let last7Vol = 0
  let prev7Vol = 0

  for (const t of rows) {
    const amt = t.amount
    grand += amt

    channelsSeen.add(t.channel)
    if (usesFidelityPayRail(t.channel)) {
      const ch = t.channel
      if (ch === 'pos' || ch === 'transfer' || ch === 'epayment' || ch === 'ussd') {
        fidelityCounts[ch] += 1
      }
    }

    const ymd = lagosYmd(t.createdAt)
    if (ymd === todayY) {
      today += amt
      todaySessions += 1
    }
    if (ymd === yesterdayY) yesterday += amt
    if (ymd >= weekRange.start && ymd <= weekRange.end) weekToDate += amt
    if (ymd >= monthRange.start && ymd <= monthRange.end) monthToDate += amt

    const st = t.status
    const b = byStatus[st]
    b.count += 1
    b.volume += amt

    if (st === 'completed' || st === 'reconciled') settledVol += amt
    if (st === 'pending' || st === 'failed') pipelineVol += amt

    const d = new Date(t.createdAt)
    if (d.getFullYear() === trafficYear) {
      monthCounts[d.getMonth()] += 1
    }

    const x = d.getTime()
    if (x >= last7.lo && x <= last7.hi) last7Vol += amt
    if (x >= prev7.lo && x <= prev7.hi) prev7Vol += amt

    for (let i = 0; i < 7; i++) {
      const { lo, hi } = dayBounds[i]
      if (x >= lo && x <= hi) {
        weekSeries[i] += amt
        break
      }
    }
  }

  type FidelityRailKey = keyof typeof fidelityCounts
  const routedTotal = FIDELITY_RAILS.reduce(
    (s, c) => s + fidelityCounts[c as FidelityRailKey],
    0,
  )
  const fidelityMix = FIDELITY_RAILS.map((c) => ({
    channel: c,
    count: fidelityCounts[c as FidelityRailKey],
    pct:
      routedTotal > 0
        ? (fidelityCounts[c as FidelityRailKey] / routedTotal) * 100
        : 0,
  }))

  let wow: number | null = null
  if (prev7Vol === 0) wow = last7Vol > 0 ? 100 : null
  else wow = ((last7Vol - prev7Vol) / prev7Vol) * 100

  const customerTraffic = TRAFFIC_MONTH_LABELS.map((label, idx) => ({
    label,
    key: `${trafficYear}-${String(idx + 1).padStart(2, '0')}`,
    count: monthCounts[idx],
  }))
  const trafficTotal = monthCounts.reduce((a, n) => a + n, 0)

  const byVehicle = new Map<VehicleType, { count: number; volume: number }>()
  for (const vt of VEHICLE_TYPES) byVehicle.set(vt, { count: 0, volume: 0 })
  for (const t of rows) {
    const b = byVehicle.get(t.vehicleType)
    if (b) {
      b.count += 1
      b.volume += t.amount
    }
  }
  const vehicleBreakdown = VEHICLE_TYPES.map((vehicleType) => ({
    vehicleType,
    ...byVehicle.get(vehicleType)!,
  }))

  const totalCount = rows.length
  const avgTicket = totalCount > 0 ? Math.round(grand / totalCount) : 0
  const settledSharePct = grand > 0 ? Math.round((settledVol / grand) * 100) : 0
  const weekMax = Math.max(1, ...weekSeries)

  return {
    grand,
    fidelityMix,
    wow,
    totalCount,
    channelsUsed: channelsSeen.size,
    vehicleBreakdown,
    customerTraffic,
    trafficYear,
    trafficTotal,
    today,
    todaySessions,
    yesterday,
    weekToDate,
    monthToDate,
    todayLabel: formatDayStamp(todayYmd()),
    yesterdayLabel: formatDayStamp(yesterdayLagosYmd()),
    weekLabel: formatYmdRange(weekRange.start, weekRange.end),
    monthLabel: formatYmdRange(monthRange.start, monthRange.end),
    settledVol,
    pipelineVol,
    byStatus,
    avgTicket,
    settledSharePct,
    weekSeries,
    weekMax,
  }
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
