import type { OverviewChannel } from '../lib/normalizeOverviewChannel'

/**
 * `GET /admin/analytics/overview` - summary + trend for the analytics page.
 *
 * ```json
 * {
 *   "avg_ticket": 0,
 *   "channel_breakdown": [
 *     { "channel": "cash", "count": 0, "share_pct": 0, "volume": 0 }
 *   ],
 *   "daily_volume_series": [{ "count": 0, "date": "2026-01-01", "volume": 0 }],
 *   "paid_count": 0,
 *   "pending_count": 0,
 *   "pipeline_volume": 0,
 *   "settled_share_pct": 0,
 *   "settled_volume": 0,
 *   "total_count": 0,
 *   "total_volume": 0
 * }
 * ```
 *
 * `channel_breakdown` may include `"channel": ""` for unassigned / pending rows.
 * `share_pct` is share of total volume (0–100).
 */
export interface AnalyticsOverviewChannelRow {
  channel: OverviewChannel
  count: number
  share_pct: number
  volume: number
}

export interface AnalyticsOverviewDailyPoint {
  count: number
  date: string
  volume: number
}

export interface AnalyticsOverviewResponse {
  avg_ticket: number
  channel_breakdown: AnalyticsOverviewChannelRow[]
  daily_volume_series: AnalyticsOverviewDailyPoint[]
  paid_count: number
  pending_count: number
  pipeline_volume: number
  settled_share_pct: number
  settled_volume: number
  total_count: number
  total_volume: number
}
