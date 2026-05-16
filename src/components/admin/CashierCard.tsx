import { cashierFirstName } from '../../lib/cashierDisplay'
import { formatMoney } from '../../lib/formatters'
import type { CashierSummary } from '../../types/reconciliation'

interface CashierCardProps {
  cashier: CashierSummary
  selected: boolean
  onSelect: () => void
}

export default function CashierCard({
  cashier,
  selected,
  onSelect,
}: CashierCardProps) {
  const name = cashierFirstName(cashier)
  const avatarUrl =
    cashier.photoUrl ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ca8a04&color=fff&size=128&rounded=true`

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
      <div className="flex items-center gap-3 p-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-2 ring-white shadow-inner">
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-950">{name}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-zinc-100 bg-zinc-100">
        <div className="bg-white px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Total sales
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-950">
            {formatMoney(cashier.totalSales)}
          </p>
        </div>
        <div className="bg-white px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Transactions
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-950">
            {cashier.transactionCount}
          </p>
        </div>
      </div>
    </button>
  )
}
