import { useState } from 'react'
import ReconciliationAlignTab from './reconciliation/ReconciliationAlignTab'
import LossTicketTab from './reconciliation/LossTicketTab'
import CashierTransactionsTab from './reconciliation/CashierTransactionsTab'

type ReconciliationTabId = 'reconciliation' | 'loss-ticket' | 'cashier'

const TABS: {
  id: ReconciliationTabId
  label: string
  shortLabel: string
  description: string
}[] = [
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    shortLabel: 'Align',
    description: 'Align, edit, and delete ledger rows',
  },
  {
    id: 'loss-ticket',
    label: 'Loss ticket',
    shortLabel: 'Loss',
    description: 'Review tickets marked as loss',
  },
  {
    id: 'cashier',
    label: 'Cashier transactions',
    shortLabel: 'Cashiers',
    description: 'Transactions by cashpoint, filtered by date',
  },
]

export default function ReconciliationPage() {
  const [tab, setTab] = useState<ReconciliationTabId>('reconciliation')
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
            Reconciliation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Align every payment type
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            Reconcile ledger rows, review loss tickets, and drill into cashier sales by
            cashpoint and time.
          </p>
        </div>
      </header>

      <section
        className="min-w-0 overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_8px_40px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5"
        aria-label="Reconciliation workspace"
      >
        <div className="border-b border-zinc-100 bg-linear-to-b from-zinc-50/80 to-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <nav
              className="min-w-0"
              aria-label="Reconciliation sections"
              role="tablist"
            >
              <div className="flex rounded-2xl bg-zinc-100/90 p-1 shadow-inner ring-1 ring-zinc-200/70">
                {TABS.map(({ id, label, shortLabel }) => {
                  const selected = tab === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      id={`recon-tab-${id}`}
                      aria-selected={selected}
                      aria-controls={`recon-panel-${id}`}
                      onClick={() => setTab(id)}
                      className={`group relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm ${
                        selected
                          ? 'bg-white text-zinc-950 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.12)] ring-1 ring-zinc-200/90'
                          : 'text-zinc-600 hover:bg-white/55 hover:text-zinc-900'
                      }`}
                    >
                      <TabIcon
                        id={id}
                        className={
                          selected
                            ? 'text-orange-600'
                            : 'text-zinc-400 group-hover:text-zinc-600'
                        }
                      />
                      <span className="truncate sm:hidden">{shortLabel}</span>
                      <span className="hidden truncate sm:inline">{label}</span>
                      {selected ? (
                        <span
                          className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-orange-500/90 sm:hidden"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </nav>

            <p className="text-[13px] leading-snug text-zinc-500 lg:max-w-sm lg:text-right">
              <span className="font-medium text-zinc-700">{activeTab.label}</span>
              <span className="mx-1.5 text-zinc-300" aria-hidden>
                ·
              </span>
              {activeTab.description}
            </p>
          </div>
        </div>

        <div
          role="tabpanel"
          id={`recon-panel-${tab}`}
          aria-labelledby={`recon-tab-${tab}`}
          className="min-w-0"
        >
          {tab === 'reconciliation' ? <ReconciliationAlignTab /> : null}
          {tab === 'loss-ticket' ? <LossTicketTab /> : null}
          {tab === 'cashier' ? (
            <CashierTransactionsTab key={tab} />
          ) : null}
        </div>
      </section>
    </div>
  )
}

function TabIcon({
  id,
  className,
}: {
  id: ReconciliationTabId
  className?: string
}) {
  const cn = `h-4 w-4 shrink-0 transition-colors ${className ?? ''}`

  if (id === 'reconciliation') {
    return (
      <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (id === 'loss-ticket') {
    return (
      <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
