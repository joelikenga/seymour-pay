import { formatDayStamp } from './formatters'
import type { AnalyticsOverviewDailyPoint } from '../types/analyticsOverview'
import type { ChartPoint } from '../components/admin/ChannelVolumeChart'

/** Map API daily points to chart data (sorted by date ascending). */
export function mapAnalyticsDailySeriesToChartPoints(
  series: AnalyticsOverviewDailyPoint[],
): ChartPoint[] {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((p) => ({
    label: p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? formatDayStamp(p.date) : p.date || '—',
    amount: p.volume,
  }))
}
