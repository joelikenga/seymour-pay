import type { PaymentChannel } from '../../types/transaction'
import {
  channelChartHex,
  channelLabel,
  PAYMENT_CHANNELS,
} from '../../lib/channelStyles'
import { formatMoney } from '../../lib/formatters'

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
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/35 ${
          selected
            ? 'border-zinc-900/10 bg-zinc-950 text-white shadow-lg shadow-zinc-950/25 ring-2 ring-orange-500/30'
            : 'border-zinc-200/90 bg-linear-to-br from-zinc-50 via-white to-orange-50/30 hover:border-orange-200/80 hover:shadow-md'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-400/[0.07] via-transparent to-violet-500/[0.08]"
          aria-hidden
        />
        <div className="relative p-4">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                selected ? 'text-orange-200' : 'text-zinc-500'
              }`}
            >
              All rails
            </span>
            <span className="flex gap-0.5" aria-hidden>
              {ALL_ACCENTS.map((c, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-sm ring-1 ring-white/30"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
          </div>
          <p
            className={`mt-3 text-xl font-bold tabular-nums tracking-tight sm:text-2xl ${
              selected ? 'text-white' : 'text-zinc-950'
            }`}
          >
            {formatMoney(volume)}
          </p>
          <p
            className={`mt-2 text-xs font-medium ${
              selected ? 'text-zinc-300' : 'text-zinc-500'
            }`}
          >
            {count} transactions · combined trend
          </p>
        </div>
      </button>
    )
  }

  const { channel, volume, count, sharePct, selected, onSelect } = props
  const color = channelChartHex[channel]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 ${
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
      <div className="pb-4 pl-4 pr-3 pt-4 sm:pl-5">
        <div className="flex items-start justify-between gap-2 pl-0.5">
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
              selected ? 'text-orange-800' : 'text-zinc-500'
            }`}
          >
            {channelLabel[channel]}
          </span>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 transition group-hover:scale-105"
            style={{
              backgroundColor: `${color}18`,
              boxShadow: selected ? `0 0 0 2px ${color}40` : undefined,
            }}
            aria-hidden
          >
            <span
              className="h-3 w-3 rounded-full ring-2 ring-white/60"
              style={{ backgroundColor: color }}
            />
          </span>
        </div>
        <p
          className={`mt-3 text-lg font-bold tabular-nums tracking-tight sm:text-xl ${
            selected ? 'text-zinc-950' : 'text-zinc-900'
          }`}
        >
          {formatMoney(volume)}
        </p>
        <div className="mt-2 flex items-center justify-between border-t border-zinc-100/80 pt-2.5 text-xs">
          <span className="font-medium text-zinc-500">{count} tx</span>
          <span
            className={`font-bold tabular-nums ${
              selected ? 'text-orange-700' : 'text-zinc-600'
            }`}
          >
            {sharePct}%
          </span>
        </div>
      </div>
    </button>
  )
}
