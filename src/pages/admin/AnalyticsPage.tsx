import { useMemo, useState } from 'react'
import ChannelDetailPanel from '../../components/admin/ChannelDetailPanel'
import PaymentTypeCard from '../../components/admin/PaymentTypeCard'
import { useAdminData } from '../../context/AdminDataContext'
import { PAYMENT_CHANNELS } from '../../lib/channelStyles'
import { totalVolume } from '../../lib/dashboardStats'
import type { PaymentChannel } from '../../types/transaction'
import {
  type DateFilterSelection,
  filterRowsByDateSelection,
  labelForMonthFilterValue,
  parseFilterValue,
} from '../../lib/transactionDateFilter'

export default function AnalyticsPage() {
  const { transactions } = useAdminData()
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

  const filtered = useMemo(
    () => filterRowsByDateSelection(transactions, dateSelection),
    [transactions, dateSelection],
  )

  const totals = useMemo(() => {
    const map = new Map<PaymentChannel, number>()
    for (const ch of PAYMENT_CHANNELS) map.set(ch, 0)
    for (const t of filtered) {
      map.set(t.channel, (map.get(t.channel) ?? 0) + t.amount)
    }
    return map
  }, [filtered])

  const counts = useMemo(() => {
    const map = new Map<PaymentChannel, number>()
    for (const ch of PAYMENT_CHANNELS) map.set(ch, 0)
    for (const t of filtered) {
      map.set(t.channel, (map.get(t.channel) ?? 0) + 1)
    }
    return map
  }, [filtered])

  const grand = useMemo(() => totalVolume(filtered), [filtered])
  const grandDenom = grand || 1

  const filterSummary = useMemo(() => {
    if (filterValue === 'all') return 'All time'
    if (filterValue === 'today') return 'Today'
    if (filterValue === '7d') return 'Last 7 days'
    if (filterValue === '30d') return 'Last 30 days'
    if (filterValue === 'custom') {
      if (!customStart || !customEnd) return 'Custom range (set dates)'
      return `Custom: ${customStart} → ${customEnd}`
    }
    if (filterValue.startsWith('month:')) {
      return labelForMonthFilterValue(filterValue) ?? 'Month'
    }
    return 'Month'
  }, [filterValue, customStart, customEnd])

  const customIncomplete =
    filterValue === 'custom' &&
    (!customStart.trim() || !customEnd.trim())

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
            Payment rails and trends.
          </p>
        </div>
      </header>

      <section aria-label="Payment types">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Payment types
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          <PaymentTypeCard
            variant="all"
            volume={grand}
            count={filtered.length}
            selected={selected === 'all'}
            onSelect={() => setSelected('all')}
          />
          {PAYMENT_CHANNELS.map((ch) => {
            const volume = totals.get(ch) ?? 0
            const count = counts.get(ch) ?? 0
            const sharePct = Math.round((volume / grandDenom) * 100)
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
      </section>

      {customIncomplete ? (
        <p className="text-sm text-amber-800">
          Open <strong>Date range</strong> in the chart panel, choose{' '}
          <strong>Custom range</strong>, set dates, then <strong>Done</strong>.
        </p>
      ) : null}

      <ChannelDetailPanel
        selection={selected}
        transactions={filtered}
        grandVolume={grand}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterSummary={filterSummary}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />
    </div>
  )
}
