import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import DropdownSelect from '../../components/admin/DropdownSelect'
import CreateCashierModal from '../../components/admin/CreateCashierModal'
import EditCashierModal from '../../components/admin/EditCashierModal'
import CashierProfileView from '../../components/admin/CashierProfileView'
import {
  useCashierAccountsQuery,
  cashierAccountsQueryKey,
} from '../../query/cashierAccounts'
import { queryClient } from '../../query/queryClient'
import { CashierAccountsApi } from '../../utils'
import {
  getCashierAccounts as getLocalCashierAccounts,
  deleteCashierAccount as deleteLocalCashierAccount,
} from '../../lib/cashiersService'
import type { CashierAccount } from '../../types/cashierAccount'
import {
  messageIndicatesAdminAccessDenied,
  ADMIN_ACCESS_DENIED_MESSAGE,
  toastRequestFailed,
} from '../../lib/apiErrors'
import {
  adminBtnDanger,
  adminBtnSecondary,
  adminModalBody,
  adminModalFooter,
  adminModalHeader,
  adminModalPanel,
  adminModalSubtitle,
  adminModalTitle,
} from '../../lib/adminModalStyles'

export default function CashiersPage() {
  const { cashierId: routeCashierId } = useParams<{ cashierId?: string }>()

  // API Query
  const {
    data: apiCashiers,
    isLoading,
    isError,
    error,
  } = useCashierAccountsQuery()

  // Local fallback if offline or initial load
  const localCashiers = useMemo(() => getLocalCashierAccounts(), [])

  const cashiers: CashierAccount[] = useMemo(() => {
    if (apiCashiers && apiCashiers.length > 0) {
      return apiCashiers
    }
    if (apiCashiers && apiCashiers.length === 0) {
      return []
    }
    if (isError) {
      return localCashiers
    }
    return apiCashiers ?? localCashiers
  }, [apiCashiers, isError, localCashiers])

  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(
    routeCashierId ?? null,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'night'>('all')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCashier, setEditingCashier] = useState<CashierAccount | null>(null)
  const [deletingCashier, setDeletingCashier] = useState<CashierAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      const isNight =
        c.gate?.toLowerCase().includes('night') || c.shift === 'night'

      if (shiftFilter === 'morning' && isNight) return false
      if (shiftFilter === 'night' && !isNight) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesUser = c.username?.toLowerCase().includes(q)
        const matchesFirst = c.firstName?.toLowerCase().includes(q)
        const matchesLast = c.lastName?.toLowerCase().includes(q)
        const matchesName = c.name?.toLowerCase().includes(q)

        if (!matchesUser && !matchesFirst && !matchesLast && !matchesName) {
          return false
        }
      }
      return true
    })
  }, [cashiers, searchQuery, shiftFilter])

  function handleCreateSuccess(newCashier: CashierAccount) {
    void queryClient.invalidateQueries({ queryKey: cashierAccountsQueryKey })
    setSelectedCashierId(newCashier.id)
  }

  function handleEditSuccess(updatedCashier: CashierAccount) {
    void queryClient.invalidateQueries({ queryKey: cashierAccountsQueryKey })
    if (selectedCashierId === updatedCashier.id) {
      setSelectedCashierId(updatedCashier.id)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingCashier) return

    setIsDeleting(true)
    try {
      await CashierAccountsApi.adminDeleteCashierAccount(deletingCashier.id)
      deleteLocalCashierAccount(deletingCashier.id)
      void queryClient.invalidateQueries({ queryKey: cashierAccountsQueryKey })

      if (selectedCashierId === deletingCashier.id) {
        setSelectedCashierId(null)
      }
      toast.success(`Removed cashier @${deletingCashier.username}`)
      setDeletingCashier(null)
    } catch (err) {
      toastRequestFailed('Could not delete cashier account', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const isAccessDenied = useMemo(() => {
    if (!isError || !error) return false
    return messageIndicatesAdminAccessDenied(error.message)
  }, [isError, error])

  // If a cashier profile is currently open, show the detail & sales view
  if (selectedCashier) {
    return (
      <>
        <CashierProfileView
          cashier={selectedCashier}
          onBack={() => setSelectedCashierId(null)}
          onEdit={() => setEditingCashier(selectedCashier)}
        />
        <EditCashierModal
          cashier={editingCashier}
          isOpen={Boolean(editingCashier)}
          onClose={() => setEditingCashier(null)}
          onSuccess={handleEditSuccess}
        />
      </>
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
              Manage cashier profiles, shifts, and view daily sales breakdown.
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

      {/* Access Denied State (403 Superadmin Required) */}
      {isAccessDenied ? (
        <div className="rounded-3xl border border-amber-200/90 bg-amber-50/40 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-bold text-zinc-950">Superadmin Role Required</h2>
          <p className="mt-1.5 max-w-md mx-auto text-xs text-zinc-600">
            {ADMIN_ACCESS_DENIED_MESSAGE} Cashier account operations require superadmin privileges.
          </p>
        </div>
      ) : (
        /* Directory Controls */
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
                placeholder="Search cashier by username or name…"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 shadow-2xs outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* Shift filter dropdown (div-based DropdownSelect) */}
            <div className="w-44 shrink-0">
              <DropdownSelect<'all' | 'morning' | 'night'>
                value={shiftFilter}
                options={[
                  { value: 'all', label: `All Shifts (${cashiers.length})` },
                  { value: 'morning', label: 'Morning Shift' },
                  { value: 'night', label: 'Night Shift' },
                ]}
                onChange={(v) => setShiftFilter(v)}
                size="sm"
                triggerClassName="h-10 bg-white"
              />
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading && cashiers.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-28 rounded bg-zinc-200" />
                      <div className="h-3 w-16 rounded bg-zinc-100" />
                    </div>
                  </div>
                  <div className="mt-6 border-t border-zinc-100 pt-3 flex justify-between">
                    <div className="h-3 w-20 rounded bg-zinc-100" />
                    <div className="h-4 w-4 rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCashiers.length === 0 ? (
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
                No cashier accounts match your search or shift filter.
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
              {filteredCashiers.map((cashier) => {
                const displayName =
                  cashier.name ||
                  `${cashier.firstName || ''} ${cashier.lastName || ''}`.trim() ||
                  cashier.username
                const initials = cashier.username.slice(0, 2).toUpperCase()
                const isNight =
                  cashier.gate?.toLowerCase().includes('night') || cashier.shift === 'night'

                return (
                  <div
                    key={cashier.id}
                    onClick={() => setSelectedCashierId(cashier.id)}
                    className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.1)] transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.15)] ring-1 ring-zinc-950/5"
                  >
                    <div>
                      {/* Top card bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 font-bold text-white shadow-sm shadow-orange-500/20">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-zinc-950 group-hover:text-orange-950">
                              {displayName}
                            </h3>
                            <p className="truncate text-xs font-medium text-zinc-500">
                              @{cashier.username}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-900">
                          {isNight ? 'Night shift' : 'Morning shift'}
                        </span>
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3">
                      <span className="text-xs font-bold text-orange-800 group-hover:text-orange-950 flex items-center gap-1">
                        View Profile &amp; Sales
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="transition transform group-hover:translate-x-0.5"
                        >
                          <path
                            d="M5 12h14m-7-7l7 7-7 7"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <div className="flex items-center gap-1">
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCashier(cashier)
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 opacity-70 transition hover:bg-orange-50 hover:text-orange-700 hover:opacity-100"
                          title="Edit cashier profile"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingCashier(cashier)
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 opacity-70 transition hover:bg-rose-50 hover:text-rose-700 hover:opacity-100"
                          title="Delete cashier account"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Create Cashier Modal */}
      <CreateCashierModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Cashier Modal */}
      <EditCashierModal
        cashier={editingCashier}
        isOpen={Boolean(editingCashier)}
        onClose={() => setEditingCashier(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deletingCashier ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className={`${adminModalPanel} max-w-md`}>
            <div className={adminModalHeader}>
              <h2 className={adminModalTitle}>Delete Cashier Account</h2>
              <p className={adminModalSubtitle}>
                This action cannot be undone. Are you sure you want to remove this account?
              </p>
            </div>

            <div className={adminModalBody}>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-xs">
                <p className="font-bold text-zinc-900">
                  {deletingCashier.name ||
                    `${deletingCashier.firstName || ''} ${deletingCashier.lastName || ''}`.trim() ||
                    deletingCashier.username}
                </p>
                <p className="text-zinc-500 capitalize">
                  @{deletingCashier.username} •{' '}
                  {deletingCashier.gate?.toLowerCase().includes('night') || deletingCashier.shift === 'night'
                    ? 'Night Shift'
                    : 'Morning Shift'}
                </p>
              </div>
            </div>

            <div className={adminModalFooter}>
              <button
                type="button"
                onClick={() => setDeletingCashier(null)}
                disabled={isDeleting}
                className={adminBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className={adminBtnDanger}
              >
                {isDeleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
