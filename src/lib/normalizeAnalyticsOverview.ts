import type { AnalyticsOverviewResponse } from '../types/analyticsOverview'
import { normalizePaymentChannel } from './normalizeTransaction'

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

function unwrapEnvelope(raw: unknown): unknown {
  const o = asRecord(raw)
  if (!o || !('data' in o)) return raw
  const inner = o.data
  return inner && typeof inner === 'object' ? inner : raw
}

function mapChannelBreakdown(raw: unknown): AnalyticsOverviewResponse['channel_breakdown'] {
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const r = asRecord(row) ?? {}
    return {
      channel: normalizePaymentChannel(r.channel),
      count: num(r.count),
      share_pct: num(r.share_pct),
      volume: num(r.volume),
    }
  })
}

function mapDailySeries(raw: unknown): AnalyticsOverviewResponse['daily_volume_series'] {
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

/** Normalizes `GET /admin/analytics/overview` JSON (flat or `{ data }`). */
export function normalizeAnalyticsOverview(raw: unknown): AnalyticsOverviewResponse {
  const root = asRecord(unwrapEnvelope(raw)) ?? {}

  return {
    avg_ticket: num(root.avg_ticket),
    channel_breakdown: mapChannelBreakdown(root.channel_breakdown),
    daily_volume_series: mapDailySeries(root.daily_volume_series),
    paid_count: num(root.paid_count),
    pending_count: num(root.pending_count),
    pipeline_volume: num(root.pipeline_volume),
    settled_share_pct: num(root.settled_share_pct),
    settled_volume: num(root.settled_volume),
    total_count: num(root.total_count),
    total_volume: num(root.total_volume),
  }
}
