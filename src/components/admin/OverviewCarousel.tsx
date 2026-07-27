import { formatMoney } from '../../lib/formatters'
import type { Transaction } from '../../types/transaction'

export interface OverviewCarouselProps {
  /** Headline content - full width of the slot. */
  totalAmount: number
  totalAmountText: string
  totalCount: number
  channelsUsed: number
  /** Week-over-week % change (null when not enough history). */
  wow: number | null
  transactions: Transaction[]
}

export default function OverviewCarousel(props: OverviewCarouselProps) {
  const { totalAmount, totalAmountText, totalCount, channelsUsed, wow } = props

  return (
    <div className="relative min-w-0 w-full">
      <TotalVolumeSlide
        amount={totalAmount}
        amountText={totalAmountText}
        totalCount={totalCount}
        channelsUsed={channelsUsed}
        wow={wow}
      />
    </div>
  )
}

interface TotalVolumeSlideProps {
  amount: number
  amountText: string
  totalCount: number
  channelsUsed: number
  wow: number | null
}

function TotalVolumeSlide({
  amount,
  amountText,
  totalCount,
  channelsUsed,
  // wow,
}: TotalVolumeSlideProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Total payment volume
      </p>
      <p
        className="mt-1 min-w-0 max-w-full wrap-break-word bg-linear-to-br from-zinc-950 to-zinc-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl md:leading-[1.08]"
        aria-label={`Total payment volume ${formatMoney(amount)}`}
        // title={amountText}
      >
        {amountText}
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        Shows total transaction revenue.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
          {totalCount.toLocaleString()} {totalCount === 1 ? 'record' : 'records'}
        </span>
        <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
          {channelsUsed} payment {channelsUsed === 1 ? 'type' : 'types'} used
        </span>
        {/* {wow != null ? (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tabular-nums ${
              wow >= 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {wow >= 0 ? '↑' : '↓'} {Math.abs(wow).toFixed(1)}% WoW
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500">
            WoW - need more history
          </span>
        )} */}
      </div>
    </div>
  )
}

