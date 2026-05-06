import { useCallback, useMemo, useState } from 'react'
import EditTransactionModal from '../../components/admin/EditTransactionModal'
import AdminPagination from '../../components/admin/AdminPagination'
import TableSearchInput from '../../components/admin/TableSearchInput'
import TableToolbar from '../../components/admin/TableToolbar'
import { useAdminData } from '../../context/AdminDataContext'
import { channelLabel, channelPillClass } from '../../lib/channelStyles'
import { vehicleLabel, vehiclePillClass } from '../../lib/vehicleStyles'
import { formatDateShort, formatMoney } from '../../lib/formatters'
import type { Transaction } from '../../types/transaction'
import { usePagination } from '../../hooks/usePagination'

const PAGE_SIZE = 10

export default function ReconciliationPage() {
  const {
    transactions,
    updateTransaction,
    deleteTransactions,
    appendLog,
  } = useAdminData()
  const [modalTx, setModalTx] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [transactions],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((t) => {
      const blob =
        `${t.reference} ${t.customerName} ${t.notes} ${t.amount} ${vehicleLabel[t.vehicleType]} ${channelLabel[t.channel]} ${t.status}`.toLowerCase()
      return blob.includes(q)
    })
  }, [sorted, query])

  const { page, setPage, totalPages, paginated, total, from, to } =
    usePagination(filtered, PAGE_SIZE, query)

  const visibleIds = useMemo(() => paginated.map((t) => t.id), [paginated])
  const visibleSelectedCount = useMemo(
    () => visibleIds.filter((id) => selectedIds.has(id)).length,
    [visibleIds, selectedIds],
  )
  const allVisibleSelected =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length
  const someVisibleSelected =
    visibleSelectedCount > 0 && !allVisibleSelected

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const togglePage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id)
      } else {
        for (const id of visibleIds) next.add(id)
      }
      return next
    })
  }, [allVisibleSelected, visibleIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const openEdit = (t: Transaction) => {
    setModalTx(t)
    setModalOpen(true)
  }

  const handleSave = (id: string, patch: Partial<Transaction>) => {
    const prev = transactions.find((t) => t.id === id)
    updateTransaction(id, patch)
    appendLog({
      action: 'reconciliation',
      summary: `Updated ${prev?.reference ?? id}`,
      detail: `Saved fields for transaction ${id}: ${Object.keys(patch).join(', ')}`,
    })
  }

  const handleConfirmDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    const removed = transactions.filter((t) => selectedIds.has(t.id))
    deleteTransactions(ids)
    const refs = removed
      .slice(0, 5)
      .map((t) => t.reference)
      .join(', ')
    const more = removed.length > 5 ? ` (+${removed.length - 5} more)` : ''
    appendLog({
      action: 'reconciliation',
      summary: `Deleted ${removed.length} transaction${removed.length === 1 ? '' : 's'}`,
      detail: `Removed ${removed.length} ledger row${removed.length === 1 ? '' : 's'}: ${refs}${more}`,
    })
    setSelectedIds(new Set())
    setConfirmOpen(false)
  }, [appendLog, deleteTransactions, selectedIds, transactions])

  const selectionCount = selectedIds.size

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
            Full ledger
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Reconciliation
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            Align <strong className="font-semibold text-zinc-800">every</strong> payment
            type — including cash — against your records. Search, tick the rows you want to
            remove, then bulk-delete. Selections persist across searches, so you can build a
            list across multiple queries before committing.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_8px_40px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5">
        <TableToolbar
          right={
            <>
              <span className="tabular-nums">
                <span className="font-bold text-zinc-900">{total}</span>{' '}
                row{total === 1 ? '' : 's'}
                {query ? ' match' : ''}
                {total > 0 && (
                  <>
                    {' '}
                    · showing <span className="tabular-nums">{from}–{to}</span>
                  </>
                )}
              </span>
              {selectionCount > 0 ? (
                <>
                  <span aria-hidden className="text-zinc-300">·</span>
                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-800 ring-1 ring-orange-200">
                    {selectionCount} selected
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[11px] font-semibold text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
                  >
                    Clear
                  </button>
                </>
              ) : null}
            </>
          }
        >
          <TableSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search ticket ID, notes…"
            ariaLabel="Search transactions"
          />
        </TableToolbar>

        {selectionCount > 0 ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50/60 px-5 py-3"
          >
            <p className="text-sm font-semibold text-orange-900">
              {selectionCount} transaction{selectionCount === 1 ? '' : 's'} selected
              <span className="ml-2 text-xs font-medium text-orange-800/80">
                Selections persist while you search.
              </span>
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.99]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Delete {selectionCount}
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="w-10 whitespace-nowrap px-4 py-3.5">
                  <SelectAllCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={togglePage}
                    disabled={visibleIds.length === 0}
                    label="Select all visible rows"
                  />
                </th>
                <th className="whitespace-nowrap px-5 py-3.5">Ticket ID</th>
                <th className="whitespace-nowrap px-5 py-3.5">Vehicle</th>
                <th className="whitespace-nowrap px-5 py-3.5">Payment type</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Amount</th>
                <th className="whitespace-nowrap px-5 py-3.5">Date</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.map((t) => {
                const isSelected = selectedIds.has(t.id)
                return (
                  <tr
                    key={t.id}
                    className={`transition ${
                      isSelected
                        ? 'bg-orange-50/70 hover:bg-orange-50'
                        : 'hover:bg-orange-50/45'
                    }`}
                  >
                    <td className="w-10 whitespace-nowrap px-4 py-3.5 align-middle">
                      <RowCheckbox
                        checked={isSelected}
                        onChange={() => toggleId(t.id)}
                        label={`Select transaction ${t.reference}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-zinc-900">
                      {t.reference}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${vehiclePillClass[t.vehicleType]}`}
                      >
                        {vehicleLabel[t.vehicleType]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${channelPillClass[t.channel]}`}
                      >
                        {channelLabel[t.channel]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums text-zinc-950">
                      {formatMoney(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-zinc-600">
                      {formatDateShort(t.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="rounded-xl bg-[#ea580c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-zinc-500"
                  >
                    No transactions match{query ? ` "${query}"` : ' your filters'}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-100 px-5 pb-5 pt-2">
          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </section>

      <EditTransactionModal
        tx={modalTx}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setModalTx(null)
        }}
        onSave={handleSave}
      />

      {confirmOpen ? (
        <ConfirmDeleteDialog
          count={selectionCount}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </div>
  )
}

interface SelectAllCheckboxProps {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
  disabled?: boolean
  label: string
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  label,
}: SelectAllCheckboxProps) {
  const state = checked
    ? 'true'
    : indeterminate
      ? 'mixed'
      : 'false'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
        checked || indeterminate
          ? 'border-orange-500 bg-orange-500 text-white'
          : 'border-zinc-300 bg-white hover:border-zinc-400'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      {checked ? <CheckIcon /> : indeterminate ? <DashIcon /> : null}
    </button>
  )
}

interface RowCheckboxProps {
  checked: boolean
  onChange: () => void
  label: string
}

function RowCheckbox({ checked, onChange, label }: RowCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
        checked
          ? 'border-orange-500 bg-orange-500 text-white'
          : 'border-zinc-300 bg-white hover:border-zinc-400'
      }`}
    >
      {checked ? <CheckIcon /> : null}
    </button>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12l5 5L20 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface ConfirmDeleteDialogProps {
  count: number
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmDeleteDialog({
  count,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <button
        type="button"
        aria-label="Close confirmation"
        onClick={onCancel}
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl ring-1 ring-zinc-950/5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h2
              id="confirm-delete-title"
              className="text-lg font-bold text-zinc-950"
            >
              Delete {count} transaction{count === 1 ? '' : 's'}?
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              This removes the selected ledger row{count === 1 ? '' : 's'} from
              this session and writes an entry to the activity log. You can't undo
              this.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Delete {count}
          </button>
        </div>
      </div>
    </div>
  )
}
