import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import CreateCashierModal from '../../components/admin/CreateCashierModal'
import CashierProfileView from '../../components/admin/CashierProfileView'
import {
  deleteCashierAccount,
  getCashierAccounts,
  type CashierAccount,
} from '../../lib/cashiersService'

export default function CashiersPage() {
  const { cashierId: routeCashierId } = useParams<{ cashierId?: string }>()
  const [cashiers, setCashiers] = useState<CashierAccount[]>(() => getCashierAccounts())
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(
    routeCashierId ?? null,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'night'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Sync with route param if navigated directly
  useEffect(() => {
    if (routeCashierId) {
      setSelectedCashierId(routeCashierId)
    }
  }, [routeCashierId])

  const selectedCashier = useMemo(() => {
    if (!selectedCashierId) return null
    return (
      cashiers.find(
        (c) =>
          c.id === selectedCashierId ||
          c.username.toLowerCase() === selectedCashierId.toLowerCase(),
      ) ?? null
    )
  }, [cashiers, selectedCashierId])

  const filteredCashiers = useMemo(() => {
    return cashiers.filter((c) => {
      if (shiftFilter !== 'all' && c.shift !== shiftFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesUser = c.username.toLowerCase().includes(q)
        if (!matchesUser) return false
      }
      return true
    })
  }, [cashiers, searchQuery, shiftFilter])

  function handleCreateSuccess(newCashier: CashierAccount) {
    setCashiers(getCashierAccounts())
    setSelectedCashierId(newCashier.id)
  }

  function handleDelete(cashier: CashierAccount) {
    if (confirm(`Are you sure you want to delete cashier ${cashier.username}?`)) {
      deleteCashierAccount(cashier.id)
      setCashiers(getCashierAccounts())
      if (selectedCashierId === cashier.id) {
        setSelectedCashierId(null)
      }
      toast.success(`Removed cashier ${cashier.username}`)
    }
  }

  // If a cashier profile is currently open, show the detail & sales view
  if (selectedCashier) {
    return (
      <CashierProfileView
        cashier={selectedCashier}
        onBack={() => setSelectedCashierId(null)}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
              Staff &amp; Operations
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              Cashiers
            </h1>
            <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-zinc-600">
              Manage cashier accounts and view daily sales across All, Cash, POS, Transfer, and USSD.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Create Cashier Account
            </button>
          </div>
        </div>
      </header>

      {/* Directory Controls */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cashier by username…"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 shadow-2xs outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>

          {/* Shift filter tabs (just morning and night) */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-1">
            {(
              [
                { id: 'all', label: 'All Shifts' },
                { id: 'morning', label: 'Morning' },
                { id: 'night', label: 'Night' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShiftFilter(s.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  shiftFilter === s.id
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cashiers Grid */}
        {filteredCashiers.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm10-3h4m-2-2v4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">
              No cashiers found
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              No cashier accounts match your search or filter.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800"
            >
              + Create Cashier Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCashiers.map((cashier) => (
              <div
                key={cashier.id}
                onClick={() => setSelectedCashierId(cashier.id)}
                className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.1)] transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.15)] ring-1 ring-zinc-950/5"
              >
                <div>
                  {/* Top card bar - only username & shift */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 font-bold text-white shadow-sm shadow-orange-500/20">
                        {cashier.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-950 group-hover:text-orange-950">
                          {cashier.username}
                        </h3>
                      </div>
                    </div>

                    <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-900">
                      {cashier.shift} shift
                    </span>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span className="text-xs font-bold text-orange-800 group-hover:text-orange-950 flex items-center gap-1">
                    View Profile &amp; Sales
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="transition transform group-hover:translate-x-0.5">
                      <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(cashier)
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 opacity-60 transition hover:bg-rose-50 hover:text-rose-700 hover:opacity-100"
                    title="Delete cashier"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Cashier Modal */}
      <CreateCashierModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
