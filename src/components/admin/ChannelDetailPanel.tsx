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
import { formatMoney } from '../../lib/formatters'
import type { PaymentChannel, Transaction } from '../../types/transaction'
import ChannelVolumeChart from './ChannelVolumeChart'
import TransactionDateFilterDropdown from './TransactionDateFilterDropdown'

export type AnalyticsSelection = PaymentChannel | 'all'

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
}: ChannelDetailPanelProps) {
  const slice =
    selection === 'all'
      ? transactions
      : rowsForChannel(transactions, selection)

  const volume = slice.reduce((a, t) => a + t.amount, 0)
  const count = slice.length
  const avg = count > 0 ? Math.round(volume / count) : 0
  const sharePct =
    grandVolume > 0 ? Math.round((volume / grandVolume) * 100) : 0

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

  const title =
    selection === 'all'
      ? 'All rails'
      : channelLabel[selection]

  const subtitle =
    selection === 'all'
      ? 'Fourteen-day stack — cash vs Fidelity-switched rails.'
      : 'Fourteen-day trend for this payment type (WAT-posted days).'

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

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Volume trend (14 days)
          </h3>
          <div className="mt-3 rounded-2xl border border-zinc-100 bg-linear-to-b from-zinc-50/80 to-white p-2 ring-1 ring-zinc-100 sm:p-3">
            <div className="touch-pan-x overflow-x-auto overscroll-x-contain sm:overflow-x-visible">
              <div className="min-w-[360px] sm:min-w-0">
                {selection === 'all' ? (
                  <ChannelVolumeChart
                    mode="multi"
                    data={chartMulti}
                    channels={PAYMENT_CHANNELS}
                    colors={channelChartHex}
                  />
                ) : (
                  <ChannelVolumeChart
                    data={chartSingle}
                    color={channelChartHex[selection]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Volume
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-zinc-950">
              {formatMoney(volume)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Transactions
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-zinc-950">
              {count}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Avg. ticket
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-zinc-950">
              {formatMoney(avg)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Share of total
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-zinc-950">
              {sharePct}%
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
