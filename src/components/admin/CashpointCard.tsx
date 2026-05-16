import { formatMoney } from '../../lib/formatters'
import type { CashpointSummary } from '../../types/reconciliation'

interface CashpointCardProps {
  cashpoint: CashpointSummary
  selected: boolean
  onSelect: () => void
}

export default function CashpointCard({
  cashpoint,
  selected,
  onSelect,
}: CashpointCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        selected
          ? 'border-orange-400/80 bg-orange-50/50 ring-2 ring-orange-500/35 shadow-md'
          : 'border-zinc-200/90 bg-white hover:border-orange-200/80 hover:shadow-md'
      }`}
    >
      <div className="border-b border-zinc-100/80 px-4 py-4">
        <p className="text-base font-bold tracking-tight text-zinc-950">
          {cashpoint.name}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-zinc-100">
        <div className="bg-white px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Total sales
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-950">
            {formatMoney(cashpoint.totalSales)}
          </p>
        </div>
        <div className="bg-white px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Transactions
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-950">
            {cashpoint.transactionCount}
          </p>
        </div>
      </div>
    </button>
  )
}
