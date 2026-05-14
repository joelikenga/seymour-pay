import type { PaymentChannel } from './transaction'

/**
 * `GET /admin/analytics/overview` — summary + trend for the analytics page.
 *
 * `channel_breakdown` lists each rail; `share_pct` is share of total volume (0–100).
 */
export interface AnalyticsOverviewChannelRow {
  channel: PaymentChannel
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
