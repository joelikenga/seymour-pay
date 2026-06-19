import { useMemo, useState } from 'react'
import ChannelDetailPanel, {
  type ChannelDetailAnalyticsBundle,
} from '../../components/admin/ChannelDetailPanel'
import PaymentTypeCard from '../../components/admin/PaymentTypeCard'
import { mapAnalyticsDailySeriesToChartPoints } from '../../lib/mapAnalyticsDailySeriesToChart'
import { PAYMENT_CHANNELS } from '../../lib/channelStyles'
import {
  isKnownPaymentChannel,
  type OverviewChannel,
} from '../../lib/normalizeOverviewChannel'
import {
  type DateFilterSelection,
  dateSelectionToAnalyticsApiRange,
  labelForTransactionDateFilter,
  parseFilterValue,
} from '../../lib/transactionDateFilter'
import { useAnalyticsOverviewQuery } from '../../query/analyticsOverview'
import type { PaymentChannel } from '../../types/transaction'

function sharePctForChannel(
  cardsTotalVolume: number,
  channel: PaymentChannel,
  breakdown: { channel: OverviewChannel; share_pct: number; volume: number }[],
): number {
  const row = breakdown.find(
    (r) => isKnownPaymentChannel(r.channel) && r.channel === channel,
  )
  const vol = row?.volume ?? 0
  const shareFromApi = row?.share_pct
  if (
    shareFromApi !== undefined &&
    Number.isFinite(shareFromApi) &&
    vol > 0
  ) {
    return shareFromApi
  }
  const denom = Math.max(1, cardsTotalVolume)
  return (vol / denom) * 100
}

export default function AnalyticsPage() {
  const [selected, setSelected] = useState<PaymentChannel | 'all'>('all')
  const [filterValue, setFilterValue] = useState<string>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateSelection: DateFilterSelection = useMemo(() => {
    const parsed = parseFilterValue(filterValue, customStart, customEnd)
    if (parsed.kind === 'custom' && (!customStart.trim() || !customEnd.trim())) {
      return { kind: 'all' }
    }
    return parsed
  }, [filterValue, customStart, customEnd])

  const apiParams = useMemo(
    () => dateSelectionToAnalyticsApiRange(dateSelection),
    [dateSelection],
  )

  const customIncomplete =
    filterValue === 'custom' &&
    (!customStart.trim() || !customEnd.trim())

  const queryEnabled = !customIncomplete

  const cardsQuery = useAnalyticsOverviewQuery(apiParams, {
    enabled: queryEnabled,
  })

  const detailParams = useMemo(() => {
    if (selected === 'all') return apiParams
    return { ...apiParams, channel: selected }
  }, [apiParams, selected])

  const detailQuery = useAnalyticsOverviewQuery(detailParams, {
    enabled: queryEnabled && selected !== 'all',
  })

  const cardsData = cardsQuery.data
  const overviewLoading = queryEnabled && cardsQuery.isPending
  const channelDetailLoading = selected !== 'all' && detailQuery.isPending

  const detailData =
    selected === 'all' ? cardsData : detailQuery.data ?? undefined

  const channelTotals = useMemo(() => {
    if (!cardsData) return null
    const map = new Map<
      PaymentChannel,
      { volume: number; count: number; sharePct: number }
    >()
    for (const ch of PAYMENT_CHANNELS) {
      const row = cardsData.channel_breakdown.find(
        (r) => isKnownPaymentChannel(r.channel) && r.channel === ch,
      )
      const volume = row?.volume ?? 0
      const count = row?.count ?? 0
      const shareFromApi = row?.share_pct
      const sharePct =
        shareFromApi !== undefined &&
        Number.isFinite(shareFromApi) &&
        volume > 0
          ? shareFromApi
          : cardsData.total_volume > 0
            ? (volume / cardsData.total_volume) * 100
            : 0
      map.set(ch, { volume, count, sharePct })
    }
    return {
      map,
      grand: cardsData.total_volume,
      grandCount: cardsData.total_count,
    }
  }, [cardsData])

  const analyticsDetail: ChannelDetailAnalyticsBundle | null = useMemo(() => {
    if (overviewLoading || channelDetailLoading || !detailData) return null
    const chartPoints = mapAnalyticsDailySeriesToChartPoints(
      detailData.daily_volume_series,
    )
    const sharePct =
      selected === 'all'
        ? 100
        : sharePctForChannel(
            cardsData?.total_volume ?? 0,
            selected,
            cardsData?.channel_breakdown ?? [],
          )
    return {
      volume: detailData.total_volume,
      count: detailData.total_count,
      avgTicket: detailData.avg_ticket,
      sharePct,
      chartPoints,
    }
  }, [
    overviewLoading,
    channelDetailLoading,
    detailData,
    selected,
    cardsData,
  ])

  const filterSummary = useMemo(
    () => labelForTransactionDateFilter(filterValue, customStart, customEnd),
    [filterValue, customStart, customEnd],
  )

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-400/18 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
            Insights
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            Payment rails and trends - totals follow the date range; each card applies the
            channel filter on the server.
          </p>
        </div>
      </header>

      <section aria-label="Payment types">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Payment types
        </h2>
        <div className="grid grid-cols-2 gap-2.5 min-[420px]:gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          <PaymentTypeCard
            variant="all"
            volume={channelTotals?.grand ?? 0}
            count={channelTotals?.grandCount ?? 0}
            selected={selected === 'all'}
            onSelect={() => setSelected('all')}
          />
          {PAYMENT_CHANNELS.map((ch) => {
            const t = channelTotals?.map.get(ch)
            const volume = t?.volume ?? 0
            const count = t?.count ?? 0
            const sharePct = t?.sharePct ?? 0
            return (
              <PaymentTypeCard
                key={ch}
                variant="channel"
                channel={ch}
                volume={volume}
                count={count}
                sharePct={sharePct}
                selected={selected === ch}
                onSelect={() => setSelected(ch)}
              />
            )
          })}
        </div>
        {overviewLoading ? (
          <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
            Loading payment-type totals…
          </p>
        ) : cardsQuery.isFetching && cardsData ? (
          <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
            Refreshing totals…
          </p>
        ) : null}
        {cardsQuery.isError ? (
          <p className="mt-3 text-sm text-rose-700">
            Could not load analytics overview.{' '}
            <span className="text-zinc-600">
              {cardsQuery.error instanceof Error
                ? cardsQuery.error.message
                : 'Unknown error'}
            </span>
          </p>
        ) : null}
      </section>

      {customIncomplete ? (
        <p className="text-sm text-amber-800">
          Open <strong>Date range</strong> in the chart panel, choose{' '}
          <strong>Custom range</strong>, set start and end date &amp; time, then{' '}
          <strong>Filter</strong>.
        </p>
      ) : null}

      <ChannelDetailPanel
        selection={selected}
        transactions={[]}
        grandVolume={channelTotals?.grand ?? 0}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterSummary={filterSummary}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        analytics={analyticsDetail}
        detailLoading={overviewLoading || channelDetailLoading}
      />
    </div>
  )
}
