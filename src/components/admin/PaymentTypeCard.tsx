import type { PaymentChannel } from '../../types/transaction'
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

const ALL_ACCENTS = PAYMENT_CHANNELS.map((c) => channelChartHex[c])

type PaymentTypeCardProps =
  | {
      variant: 'all'
      volume: number
      count: number
      selected: boolean
      onSelect: () => void
    }
  | {
      variant: 'channel'
      channel: PaymentChannel
      volume: number
      count: number
      sharePct: number
      selected: boolean
      onSelect: () => void
    }

export default function PaymentTypeCard(props: PaymentTypeCardProps) {
  if (props.variant === 'all') {
    const { volume, count, selected, onSelect } = props
    const volumeLabel = formatMoneyCompact(volume)
    return (
      <button
        type="button"
        onClick={onSelect}
        title={`${formatMoney(volume)} · ${formatCount(count)} transactions`}
        className={`group relative flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/35 ${
          selected
            ? 'border-zinc-900/10 bg-zinc-950 text-white shadow-lg shadow-zinc-950/25 ring-2 ring-orange-500/30'
            : 'border-zinc-200/90 bg-linear-to-br from-zinc-50 via-white to-orange-50/30 hover:border-orange-200/80 hover:shadow-md'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-400/[0.07] via-transparent to-violet-500/[0.08]"
          aria-hidden
        />
        <div className="relative min-w-0 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-1.5">
            <span
              className={`min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.14em] ${
                selected ? 'text-orange-200' : 'text-zinc-500'
              }`}
            >
              All rails
            </span>
            <span className="flex shrink-0 gap-0.5" aria-hidden>
              {ALL_ACCENTS.map((c, i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-sm ring-1 ring-white/30 sm:h-2.5 sm:w-2.5"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
          </div>
          <p
            className={`mt-2 min-w-0 truncate text-base font-bold tabular-nums tracking-tight sm:mt-3 sm:text-xl ${
              selected ? 'text-white' : 'text-zinc-950'
            }`}
          >
            {volumeLabel}
          </p>
          <p
            className={`mt-1.5 min-w-0 truncate text-[10px] font-medium leading-snug sm:mt-2 sm:text-xs ${
              selected ? 'text-zinc-300' : 'text-zinc-500'
            }`}
          >
            {formatCount(count)} tx · combined
          </p>
        </div>
      </button>
    )
  }

  const { channel, volume, count, sharePct, selected, onSelect } = props
  const color = channelChartHex[channel]
  const volumeLabel = formatMoneyCompact(volume)

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${channelLabel[channel]} · ${formatMoney(volume)} · ${formatCount(count)} transactions · ${formatSharePct(sharePct)} of volume`}
      className={`group relative flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 ${
        selected
          ? 'border-transparent bg-white shadow-md ring-2 ring-orange-500/35'
          : 'border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-md'
      }`}
    >
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl transition group-hover:w-2"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="min-w-0 pb-3.5 pl-3.5 pr-2.5 pt-3.5 sm:pb-4 sm:pl-4 sm:pr-3 sm:pt-4">
        <div className="flex items-start justify-between gap-1.5 pl-0.5">
          <span
            className={`min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.1em] sm:text-[11px] sm:tracking-[0.12em] ${
              selected ? 'text-orange-800' : 'text-zinc-500'
            }`}
          >
            {channelLabel[channel]}
          </span>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 transition group-hover:scale-105 sm:h-8 sm:w-8 sm:rounded-xl"
            style={{
              backgroundColor: `${color}18`,
              boxShadow: selected ? `0 0 0 2px ${color}40` : undefined,
            }}
            aria-hidden
          >
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white/60 sm:h-3 sm:w-3"
              style={{ backgroundColor: color }}
            />
          </span>
        </div>
        <p
          className={`mt-2 min-w-0 truncate text-base font-bold tabular-nums tracking-tight sm:mt-3 sm:text-lg ${
            selected ? 'text-zinc-950' : 'text-zinc-900'
          }`}
        >
          {volumeLabel}
        </p>
        <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1 border-t border-zinc-100/80 pt-2 text-[10px] sm:mt-2 sm:pt-2.5 sm:text-xs">
          <span className="min-w-0 truncate font-medium text-zinc-500">
            {formatCount(count)} tx
          </span>
          <span
            className={`shrink-0 font-bold tabular-nums ${
              selected ? 'text-orange-800' : 'text-zinc-600'
            }`}
          >
            {formatSharePct(sharePct)}
          </span>
        </div>
      </div>
    </button>
  )
}
