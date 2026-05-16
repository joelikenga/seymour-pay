import { useMemo, useState } from 'react'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import {
  clearPayTransactions,
  loadPayTransactions,
} from '../../lib/payTransactionHistory'
import PayMobileLogo from './PayMobileLogo'

function methodLabel(method: string): string {
  return method === 'transfer' ? 'Bank transfer' : 'Card'
}

export default function PayHistoryPage() {
  const [historyTick, setHistoryTick] = useState(0)
  const historyItems = useMemo(
    () => loadPayTransactions(),
    [historyTick],
  )

  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain bg-zinc-100 max-lg:pb-20 lg:bg-linear-to-b lg:from-zinc-50 lg:to-zinc-100/80 lg:px-12 lg:pb-12 lg:pt-10">
      <div className="mx-auto w-full max-w-md px-4 pb-8 max-lg:pb-24 lg:max-w-3xl lg:px-0 lg:pb-0">
        <PayMobileLogo />
        <div className="flex flex-col gap-3 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between lg:pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600/90">
              On this device
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
              Payment history
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 lg:text-base">
              Last 10 payments saved in this browser.
            </p>
          </div>
          {historyItems.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                clearPayTransactions()
                setHistoryTick((t) => t + 1)
              }}
              className="shrink-0 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 sm:self-auto"
            >
              Clear all
            </button>
          ) : null}
        </div>

        {historyItems.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-zinc-300 bg-white/80 px-6 py-14 text-center shadow-sm lg:mt-12 lg:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l2.5 2.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
                />
              </svg>
            </div>
            <p className="mt-4 text-base font-semibold text-zinc-800">
              No payments yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
              Complete a ticket payment and it will appear here for quick reference.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3 lg:mt-8 lg:space-y-4">
            {historyItems.map((h) => (
              <li
                key={h.id}
                className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_8px_30px_-16px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5 transition hover:shadow-[0_12px_36px_-16px_rgba(15,23,42,0.16)]"
              >
                <div className="flex gap-0">
                  <div className="w-1 shrink-0 bg-linear-to-b from-orange-400 to-orange-600" />
                  <div className="min-w-0 flex-1 px-4 py-4 lg:px-5 lg:py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          Ticket
                        </p>
                        <p className="mt-0.5 truncate font-mono text-base font-bold text-zinc-950 lg:text-lg">
                          {h.ticketId}
                        </p>
                      </div>
                      <p className="text-lg font-bold tabular-nums text-zinc-950 lg:text-xl">
                        {formatMoney(h.amount, h.currency)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {formatDateTime(h.paidAt)}
                      </span>
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800">
                        {methodLabel(h.payMethod)}
                      </span>
                    </div>
                    <p className="mt-3 truncate font-mono text-xs text-zinc-400">
                      Ref {h.paymentRef}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
