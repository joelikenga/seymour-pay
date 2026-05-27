import { useMemo } from 'react'
import {
  dailyVolumeAllChannels,
  dailyVolumeByChannel,
  rowsForChannel,
} from '../../lib/analyticsChannels'
import {
  channelChartHex,
  channelLabel,
  PAYMENT_CHANNELS,
} from '../../lib/channelStyles'
import {
  formatCount,
  formatMoney,
  formatMoneyCompact,
  formatSharePct,
} from '../../lib/formatters'
import type { PaymentChannel, Transaction } from '../../types/transaction'
import ChannelVolumeChart from './ChannelVolumeChart'
import TransactionDateFilterDropdown from './TransactionDateFilterDropdown'

export type AnalyticsSelection = PaymentChannel | 'all'

/** KPI + series from `GET /admin/analytics/overview` for the active card / date range. */
export type ChannelDetailAnalyticsBundle = {
  volume: number
  count: number
  avgTicket: number
  sharePct: number
  chartPoints: { label: string; amount: number }[]
}

interface ChannelDetailPanelProps {
  selection: AnalyticsSelection
  transactions: Transaction[]
  grandVolume: number
  filterValue: string
  onFilterChange: (value: string) => void
  filterSummary: string
  customStart: string
  customEnd: string
  onCustomStartChange: (v: string) => void
  onCustomEndChange: (v: string) => void
  /** When set, KPIs + chart use the analytics API instead of local `transactions`. */
  analytics?: ChannelDetailAnalyticsBundle | null
  /** Shown while a scoped overview request is in flight (e.g. a payment-type card). */
  detailLoading?: boolean
}

export default function ChannelDetailPanel({
  selection,
  transactions,
  grandVolume,
  filterValue,
  onFilterChange,
  filterSummary,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  analytics,
  detailLoading = false,
}: ChannelDetailPanelProps) {
  const slice =
    selection === 'all'
      ? transactions
      : rowsForChannel(transactions, selection)

  const volume = analytics ? analytics.volume : slice.reduce((a, t) => a + t.amount, 0)
  const count = analytics ? analytics.count : slice.length
  const avg = analytics
    ? analytics.avgTicket
    : count > 0
      ? Math.round(volume / count)
      : 0
  const sharePct = analytics
    ? analytics.sharePct
    : grandVolume > 0
      ? Math.round((volume / grandVolume) * 100)
      : 0

  const chartSingle = useMemo(() => {
    if (selection === 'all') return [] as { label: string; amount: number }[]
    return dailyVolumeByChannel(transactions, selection, 14).map(
      ({ label, amount }) => ({ label, amount }),
    )
  }, [transactions, selection])

  const chartMulti = useMemo(
    () => dailyVolumeAllChannels(transactions, PAYMENT_CHANNELS, 14),
    [transactions],
  )

  const useApiChart = Boolean(analytics) && !detailLoading
  const apiChartColor =
    selection === 'all' ? '#27272a' : channelChartHex[selection as PaymentChannel]

  const title =
    selection === 'all'
      ? 'All rails'
      : channelLabel[selection as PaymentChannel]

  const subtitle = analytics
    ? selection === 'all'
      ? 'Daily volume trend for the selected date range (from the server).'
      : 'Daily volume trend for this rail and date range (from the server).'
    : selection === 'all'
      ? 'Fourteen-day stack - cash vs Fidelity-switched rails.'
      : 'Fourteen-day trend for this payment type (WAT-posted days).'

  const trendHeading = analytics ? 'Volume trend' : 'Volume trend (14 days)'

  const kpiPending = detailLoading

  /** Tall chart area - full width; ~20% shorter than the previous viewport-relative height. */
  const chartAreaClass =
    'h-[min(45svh,512px)] w-full min-h-[224px] sm:h-[min(50svh,576px)]'

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_12px_48px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5">
      <div className="flex flex-col gap-4 border-b border-zinc-100 bg-linear-to-r from-white via-orange-50/15 to-zinc-50/90 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-800/80">
            {selection === 'all' ? 'Overview' : 'Selected payment type'}
          </p>
          <h2 className="mt-1 text-xl font-bold text-zinc-950">{title}</h2>
          <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-zinc-500">
            {subtitle}
          </p>
        </div>
        <TransactionDateFilterDropdown
          filterValue={filterValue}
          onFilterChange={onFilterChange}
          triggerLabel={filterSummary}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={onCustomStartChange}
          onCustomEndChange={onCustomEndChange}
        />
      </div>

      <div className="flex flex-col">
        <div className="border-b border-zinc-100 px-4 py-3 sm:px-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {trendHeading}
          </h3>
        </div>

        <div className="w-full border-b border-zinc-100 bg-linear-to-b from-zinc-50/90 to-white">
          <div className="touch-pan-x overflow-x-auto overscroll-x-contain sm:overflow-x-visible">
            <div className="w-full min-w-0 px-2 py-3 sm:px-4 sm:py-5">
              {detailLoading ? (
                <div
                  className={`flex items-center justify-center rounded-xl bg-zinc-50/50 text-sm text-zinc-500 ${chartAreaClass}`}
                >
                  Loading chart…
                </div>
              ) : useApiChart && analytics ? (
                analytics.chartPoints.length > 0 ? (
                  <ChannelVolumeChart
                    data={analytics.chartPoints}
                    color={apiChartColor}
                    chartContainerClassName={chartAreaClass}
                  />
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-xl bg-zinc-50/40 text-sm text-zinc-500 ${chartAreaClass}`}
                  >
                    No data found
                  </div>
                )
              ) : selection === 'all' ? (
                <ChannelVolumeChart
                  mode="multi"
                  data={chartMulti}
                  channels={PAYMENT_CHANNELS}
                  colors={channelChartHex}
                  chartContainerClassName={chartAreaClass}
                />
              ) : (
                <ChannelVolumeChart
                  data={chartSingle}
                  color={channelChartHex[selection]}
                  chartContainerClassName={chartAreaClass}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto p-4 sm:gap-4 sm:p-6">
          <div className="flex min-h-18 min-w-0 flex-1 flex-col justify-center rounded-xl border border-zinc-200/80 bg-white px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Volume
            </p>
            <p
              className="mt-1 min-w-0 truncate text-base font-semibold tabular-nums text-zinc-950"
              title={kpiPending ? undefined : formatMoney(volume)}
            >
              {kpiPending ? 'N/A' : formatMoneyCompact(volume)}
            </p>
          </div>
          <div className="flex min-h-18 min-w-0 flex-1 flex-col justify-center rounded-xl border border-zinc-200/80 bg-white px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Transactions
            </p>
            <p
              className="mt-1 min-w-0 truncate text-base font-semibold tabular-nums text-zinc-950"
              title={kpiPending ? undefined : formatCount(count)}
            >
              {kpiPending ? 'N/A' : formatCount(count)}
            </p>
          </div>
          <div className="flex min-h-18 min-w-0 flex-1 flex-col justify-center rounded-xl border border-zinc-200/80 bg-white px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Avg. ticket
            </p>
            <p
              className="mt-1 min-w-0 truncate text-base font-semibold tabular-nums text-zinc-950"
              title={kpiPending ? undefined : formatMoney(avg)}
            >
              {kpiPending ? 'N/A' : formatMoneyCompact(avg)}
            </p>
          </div>
          <div className="flex min-h-18 min-w-0 flex-1 flex-col justify-center rounded-xl border border-zinc-200/80 bg-white px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Share of total
            </p>
            <p className="mt-1 min-w-0 truncate text-base font-semibold tabular-nums text-zinc-950">
              {kpiPending ? 'N/A' : formatSharePct(sharePct)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
