import type { PaymentChannel, VehicleType } from './transaction'

/**
 * `GET /admin/analytics/dashboard` — analytics overview payload.
 *
 * ```json
 * {
 *   "channel_breakdown": [{ "channel": "cash", "count": 0, "volume": 0 }],
 *   "daily_volume_series": [{ "count": 0, "date": "string", "volume": 0 }],
 *   "month_volume": 0,
 *   "monthly_traffic": [{ "count": 0, "key": "string", "label": "string" }],
 *   "paid_count": 0,
 *   "pending_count": 0,
 *   "today_count": 0,
 *   "today_volume": 0,
 *   "total_count": 0,
 *   "total_volume": 0,
 *   "vehicle_breakdown": [{ "count": 0, "vehicle_type": "car", "volume": 0 }],
 *   "week_volume": 0
 * }
 * ```
 */
export interface DashboardOverviewChannelBreakdown {
  channel: PaymentChannel
  count: number
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
}
