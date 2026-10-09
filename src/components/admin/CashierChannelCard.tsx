import { formatMoney } from '../../lib/formatters'
import type { CashierChannelTotals } from '../../lib/cashiersService'

export type CashierChannelType = 'all' | 'cash' | 'pos' | 'transfer' | 'ussd'

interface CashierChannelCardProps {
  channel: CashierChannelType
  totals: CashierChannelTotals
}

const CHANNEL_CONFIG: Record<
  CashierChannelType,
  {
    title: string
    borderClass: string
    bgGradient: string
    iconBg: string
    iconColor: string
    icon: React.ReactNode
  }
> = {
  all: {
    title: 'All',
    borderClass: 'border-orange-200/90 hover:border-orange-300',
    bgGradient: 'bg-linear-to-br from-white via-white to-orange-50/40',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-700',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  cash: {
    title: 'Cash',
    borderClass: 'border-emerald-200/90 hover:border-emerald-300',
    bgGradient: 'bg-linear-to-br from-white via-white to-emerald-50/40',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-700',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  pos: {
    title: 'POS',
    borderClass: 'border-sky-200/90 hover:border-sky-300',
    bgGradient: 'bg-linear-to-br from-white via-white to-sky-50/40',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-700',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <rect x="7" y="5" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="9" cy="14" r="1" fill="currentColor" />
        <circle cx="12" cy="14" r="1" fill="currentColor" />
        <circle cx="15" cy="14" r="1" fill="currentColor" />
        <circle cx="9" cy="17" r="1" fill="currentColor" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
        <circle cx="15" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
  },
  transfer: {
    title: 'Transfer',
    borderClass: 'border-violet-200/90 hover:border-violet-300',
    bgGradient: 'bg-linear-to-br from-white via-white to-violet-50/40',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-700',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  ussd: {
    title: 'USSD',
    borderClass: 'border-amber-200/90 hover:border-amber-300',
    bgGradient: 'bg-linear-to-br from-white via-white to-amber-50/40',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-700',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M9.5 8.5l5 7m0-7l-5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
}

export default function CashierChannelCard({
  channel,
  totals,
}: CashierChannelCardProps) {
  const cfg = CHANNEL_CONFIG[channel]
  const avg = totals.count > 0 ? Math.round(totals.volume / totals.count) : 0

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${cfg.borderClass} ${cfg.bgGradient} p-4.5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.12)]`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconColor} shadow-2xs`}
        >
          {cfg.icon}
        </div>
        <p className="text-sm font-bold text-zinc-900">{cfg.title}</p>
      </div>

      <div className="mt-4 pt-2 border-t border-zinc-100/80">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Total Sales Volume
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
          {formatMoney(totals.volume)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-600">
        <span className="font-semibold text-zinc-700">
          <strong className="text-zinc-900 tabular-nums">{totals.count}</strong> {totals.count === 1 ? 'sale' : 'sales'}
        </span>
        <span className="text-zinc-400">
          Avg: <span className="font-semibold text-zinc-700 tabular-nums">{formatMoney(avg)}</span>
        </span>
      </div>
    </div>
  )
}
