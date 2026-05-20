import type { PaymentChannel, VehicleType } from './transaction'

/**
 * `GET /admin/analytics/dashboard` - analytics overview payload.
 *
 * ```json
 * {
 *   "avg_ticket": 0,
 *   "channel_breakdown": [
 *     { "channel": "cash", "count": 0, "share_pct": 0, "volume": 0 }
 *   ],
 *   "daily_volume_series": [{ "count": 0, "date": "2026-01-01", "volume": 0 }],
 *   "month_volume": 0,
 *   "monthly_traffic": [{ "count": 0, "key": "2026-01", "label": "Jan" }],
 *   "paid_count": 0,
 *   "pending_count": 0,
 *   "pipeline_volume": 0,
 *   "settled_share_pct": 0,
 *   "settled_volume": 0,
 *   "today_count": 0,
 *   "today_volume": 0,
 *   "total_count": 0,
 *   "total_volume": 0,
 *   "vehicle_breakdown": [{ "count": 0, "vehicle_type": "car", "volume": 0 }],
 *   "week_volume": 0,
 *   "yesterday_count": 0,
 *   "yesterday_volume": 0
 * }
 * ```
 */
export interface DashboardOverviewChannelBreakdown {
  channel: PaymentChannel
  count: number
  /** Share of total volume attributed to this channel (0–100), when the API sends it. */
  share_pct: number
  volume: number
}

export interface DashboardOverviewDailyVolumePoint {
  count: number
  /** ISO calendar date string (`YYYY-MM-DD`) from the API. */
  date: string
  volume: number
}

export interface DashboardOverviewMonthlyTraffic {
  count: number
  key: string
  label: string
}

export interface DashboardOverviewVehicleBreakdown {
  count: number
  vehicle_type: VehicleType
  volume: number
}

export interface DashboardOverviewResponse {
  channel_breakdown: DashboardOverviewChannelBreakdown[]
  daily_volume_series: DashboardOverviewDailyVolumePoint[]
  month_volume: number
  monthly_traffic: DashboardOverviewMonthlyTraffic[]
  paid_count: number
  pending_count: number
  today_count: number
  today_volume: number
  total_count: number
  total_volume: number
  vehicle_breakdown: DashboardOverviewVehicleBreakdown[]
  week_volume: number

  /** Average ticket size; only set when the API sends the field. */
  avg_ticket?: number
  /** Volume in settled states (e.g. completed + reconciled); only set when the API sends it. */
  settled_volume?: number
  /** Volume still in flight (e.g. pending + failed); only set when the API sends it. */
  pipeline_volume?: number
  /** Settled volume as % of total volume (0–100); only set when the API sends it. */
  settled_share_pct?: number
  /** Transaction count for the previous calendar day (server semantics). */
  yesterday_count?: number
  /** Volume total for the previous calendar day. */
  yesterday_volume?: number
}
