import { PAYMENT_CHANNELS } from './channelStyles'
import { formatDayStamp, formatYmdRange } from './formatters'
import type { DashboardOverviewResponse } from '../types/dashboardOverview'
import type { PaymentChannel } from '../types/transaction'
import type { OverviewDashboardStats } from './dashboardStats'
import { VEHICLE_TYPES, vehicleParkingRates } from './vehicleStyles'
import {
  emptyOverviewDashboardStats,
  FIDELITY_RAILS,
  monthToDateRange,
  todayYmd,
  weekToDateRange,
  yesterdayLagosYmd,
} from './dashboardStats'

function isPaymentChannel(s: string): s is PaymentChannel {
  return (PAYMENT_CHANNELS as readonly string[]).includes(s)
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const x = Number(v)
    if (Number.isFinite(x)) return x
  }
  return fallback
}

function weekSeriesFromDaily(
  series: DashboardOverviewResponse['daily_volume_series'],
): number[] {
  const sorted = [...(series ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const vols = sorted.map((d) => num(d.volume))
  if (vols.length >= 7) return vols.slice(-7)
  const pad = 7 - vols.length
  return [...Array(pad).fill(0), ...vols]
}

function wowFromDailySeries(
  series: DashboardOverviewResponse['daily_volume_series'],
): number | null {
  const sorted = [...(series ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 14) return null
  const last7 = sorted.slice(-7).reduce((s, d) => s + num(d.volume), 0)
  const prev7 = sorted.slice(-14, -7).reduce((s, d) => s + num(d.volume), 0)
  if (prev7 === 0) return last7 > 0 ? 100 : null
  return ((last7 - prev7) / prev7) * 100
}

function trafficYearFromMonthly(
  monthly: DashboardOverviewResponse['monthly_traffic'],
): number {
  const key = monthly?.[0]?.key
  if (!key) return new Date().getFullYear()
  const y = Number(key.split('-')[0])
  return Number.isFinite(y) ? y : new Date().getFullYear()
}

/** Maps `/admin/analytics/dashboard` JSON into {@link OverviewDashboardStats}. */
export function mapOverviewToDashboardStats(
  raw: DashboardOverviewResponse,
): OverviewDashboardStats {
  const channel_breakdown = raw.channel_breakdown ?? []
  const daily_volume_series = raw.daily_volume_series ?? []
  const monthly_traffic = raw.monthly_traffic ?? []
  const vehicle_breakdown = raw.vehicle_breakdown ?? []

  const paid_count = num(raw.paid_count)
  const pending_count = num(raw.pending_count)
  const total_count = num(raw.total_count)
  const total_volume = num(raw.total_volume)
  const denom = Math.max(1, paid_count + pending_count)

  const weekRange = weekToDateRange()
  const monthRange = monthToDateRange()

  const useApiSettlementVolumes =
    raw.settled_volume !== undefined &&
    raw.pipeline_volume !== undefined &&
    Number.isFinite(raw.settled_volume) &&
    Number.isFinite(raw.pipeline_volume)

  const byStatus: OverviewDashboardStats['byStatus'] = useApiSettlementVolumes
    ? {
        completed: {
          count: paid_count,
          volume: num(raw.settled_volume),
        },
        pending: {
          count: pending_count,
          volume: num(raw.pipeline_volume),
        },
        failed: { count: 0, volume: 0 },
        reconciled: { count: 0, volume: 0 },
      }
    : {
        completed: {
          count: paid_count,
          volume: total_volume * (paid_count / denom),
        },
        pending: {
          count: pending_count,
          volume: total_volume * (pending_count / denom),
        },
        failed: { count: 0, volume: 0 },
        reconciled: { count: 0, volume: 0 },
      }

  const settledVol = byStatus.completed.volume + byStatus.reconciled.volume
  const pipelineVol = byStatus.pending.volume + byStatus.failed.volume

  const routedTotal = FIDELITY_RAILS.reduce((sum, ch) => {
    const row = channel_breakdown.find(
      (r) => r.channel !== '' && isPaymentChannel(r.channel) && r.channel === ch,
    )
    return sum + num(row?.count)
  }, 0)

  const fidelityMix = FIDELITY_RAILS.map((c) => {
    const row = channel_breakdown.find(
      (r) => r.channel !== '' && isPaymentChannel(r.channel) && r.channel === c,
    )
    const count = num(row?.count)
    const volume = num(row?.volume)
    const shareFromApi = row?.share_pct
    const pct =
      shareFromApi !== undefined &&
      Number.isFinite(shareFromApi) &&
      volume > 0
        ? num(shareFromApi)
        : routedTotal > 0
          ? (count / routedTotal) * 100
          : 0
    return {
      channel: c,
      count,
      pct,
    }
  })

  const channelsUsed = channel_breakdown.filter((r) => {
    if (r.channel === '' || !isPaymentChannel(r.channel)) return false
    return num(r.count) > 0 || num(r.volume) > 0
  }).length

  const weekSeries = weekSeriesFromDaily(daily_volume_series)
  const weekMax = Math.max(1, ...weekSeries)
  const wow = wowFromDailySeries(daily_volume_series)

  const trafficYear = trafficYearFromMonthly(monthly_traffic)
  const customerTraffic =
    monthly_traffic.length > 0
      ? monthly_traffic.map((m) => ({
          label: String(m.label ?? ''),
          key: String(m.key ?? ''),
          count: num(m.count),
        }))
      : emptyOverviewDashboardStats().customerTraffic
  const trafficTotal = customerTraffic.reduce((a, r) => a + r.count, 0)

  /** Vehicle types panel — API `vehicle_breakdown` plus static Coaster tariffs. */
  const coasterTariff = vehicleParkingRates.coaster
  const coasterFromApi = vehicle_breakdown.find((r) => r.vehicle_type === 'coaster')
  const vehicleBreakdown = [
    ...vehicle_breakdown
      .filter((row) => row.vehicle_type !== 'coaster')
      .map((row) => ({
        vehicleType: row.vehicle_type,
        count: num(row.count),
        volume: num(row.volume),
        amount: num(row.amount),
        extraCharge: num(row.extra_charge),
      })),
    {
      vehicleType: 'coaster' as const,
      count: num(coasterFromApi?.count),
      volume: num(coasterFromApi?.volume),
      amount: coasterTariff.defaultRate,
      extraCharge: coasterTariff.extraHourRate,
    },
  ].sort(
    (a, b) =>
      VEHICLE_TYPES.indexOf(a.vehicleType) - VEHICLE_TYPES.indexOf(b.vehicleType),
  )

  const grand = total_volume
  const computedAvgTicket =
    total_count > 0 ? Math.round(grand / total_count) : 0
  const avgTicket =
    raw.avg_ticket !== undefined && Number.isFinite(raw.avg_ticket)
      ? Math.round(num(raw.avg_ticket))
      : computedAvgTicket
  const computedSettledSharePct =
    grand > 0 ? Math.round((settledVol / grand) * 100) : 0
  const settledSharePct =
    raw.settled_share_pct !== undefined && Number.isFinite(raw.settled_share_pct)
      ? Math.round(num(raw.settled_share_pct))
      : computedSettledSharePct

  return {
    grand,
    fidelityMix,
    wow,
    totalCount: total_count,
    channelsUsed,
    vehicleBreakdown,
    customerTraffic,
    trafficYear,
    trafficTotal,
    today: num(raw.today_volume),
    todaySessions: num(raw.today_count),
    yesterday:
      raw.yesterday_volume !== undefined && Number.isFinite(raw.yesterday_volume)
        ? num(raw.yesterday_volume)
        : 0,
    weekToDate: num(raw.week_volume),
    monthToDate: num(raw.month_volume),
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
