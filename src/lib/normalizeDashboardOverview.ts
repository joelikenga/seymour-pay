import type { DashboardOverviewResponse } from '../types/dashboardOverview'
import { normalizePaymentChannel, normalizeVehicleType } from './normalizeTransaction'

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const x = Number(v)
    if (Number.isFinite(x)) return x
  }
  return fallback
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

/** If the backend wraps the payload as `{ data: { ... } }`, return the inner object. */
function unwrapEnvelope(raw: unknown): unknown {
  const o = asRecord(raw)
  if (!o || !('data' in o)) return raw
  const inner = o.data
  return inner && typeof inner === 'object' ? inner : raw
}

function mapChannelBreakdown(raw: unknown): DashboardOverviewResponse['channel_breakdown'] {
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const r = asRecord(row) ?? {}
    return {
      channel: normalizePaymentChannel(r.channel),
      count: num(r.count),
      volume: num(r.volume),
    }
  })
}

function mapDailySeries(raw: unknown): DashboardOverviewResponse['daily_volume_series'] {
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const r = asRecord(row) ?? {}
    return {
      count: num(r.count),
      date: typeof r.date === 'string' ? r.date : '',
      volume: num(r.volume),
    }
  })
}

function mapMonthlyTraffic(raw: unknown): DashboardOverviewResponse['monthly_traffic'] {
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const r = asRecord(row) ?? {}
    return {
      count: num(r.count),
      key: typeof r.key === 'string' ? r.key : '',
      label: typeof r.label === 'string' ? r.label : '',
    }
  })
}

function mapVehicleBreakdown(raw: unknown): DashboardOverviewResponse['vehicle_breakdown'] {
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const r = asRecord(row) ?? {}
    return {
      count: num(r.count),
      vehicle_type: normalizeVehicleType(r.vehicle_type ?? r.vehicleType),
      volume: num(r.volume),
    }
  })
}

/**
 * Normalizes `GET /admin/analytics/dashboard` JSON into {@link DashboardOverviewResponse}.
 * Accepts either the flat shape or `{ data: { ... } }`.
 */
export function normalizeDashboardOverview(raw: unknown): DashboardOverviewResponse {
  const root = asRecord(unwrapEnvelope(raw)) ?? {}

  return {
    channel_breakdown: mapChannelBreakdown(root.channel_breakdown),
    daily_volume_series: mapDailySeries(root.daily_volume_series),
    month_volume: num(root.month_volume),
    monthly_traffic: mapMonthlyTraffic(root.monthly_traffic),
    paid_count: num(root.paid_count),
    pending_count: num(root.pending_count),
    today_count: num(root.today_count),
    today_volume: num(root.today_volume),
    total_count: num(root.total_count),
    total_volume: num(root.total_volume),
    vehicle_breakdown: mapVehicleBreakdown(root.vehicle_breakdown),
    week_volume: num(root.week_volume),
  }
}
