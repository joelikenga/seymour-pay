import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useAdminListPage } from '../../../hooks/useAdminListPage'
import { toast } from 'sonner'
import EditTransactionModal from '../../../components/admin/EditTransactionModal'
import AdminPagination from '../../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../../components/admin/AdminTableSkeletonBody'
import TableSearchInput from '../../../components/admin/TableSearchInput'
import TableToolbar from '../../../components/admin/TableToolbar'
import { useAdminData } from '../../../context/AdminDataContext'
import { channelLabel, channelPillClass } from '../../../lib/channelStyles'
import { vehicleTypeToApiPayload } from '../../../lib/normalizeTransaction'
import { vehicleLabel, vehiclePillClass } from '../../../lib/vehicleStyles'
import { describeTransactionPatchForLog } from '../../../lib/describeTransactionPatchForLog'
import { formatDateShort, formatMoney } from '../../../lib/formatters'
import type { Transaction } from '../../../types/transaction'
import {
  RECONCILIATION_PAGE_SIZE,
  useTransactionsListQuery,
} from '../../../query/transactionsList'
import { dashboardOverviewQueryKey } from '../../../query/dashboardOverview'
import { settlementTransactionsQueryKey } from '../../../query/settlement'
import { queryClient } from '../../../query/queryClient'
import { TransactionsApi } from '../../../utils'
import { toastRequestFailed } from '../../../lib/apiErrors'
import {
  adminBtnDanger,
  adminBtnSecondary,
  adminModalBackdrop,
  adminModalFooter,
  adminModalHeader,
  adminModalPanel,
  adminModalSubtitle,
  adminModalTitle,
} from '../../../lib/adminModalStyles'

export default function ReconciliationAlignTab() {
  const { appendLog } = useAdminData()
  const [modalTx, setModalTx] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { pageIndex, setPageIndex, uiPage } = useAdminListPage([debouncedQuery])
  /** Map row id → ticket id for API bulk delete (`ids` = ticket references). */
  const [selectedById, setSelectedById] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const listQuery = useTransactionsListQuery(
    pageIndex,
    debouncedQuery,
    { kind: 'all' },
    RECONCILIATION_PAGE_SIZE,
  )
  const payload = listQuery.data
  const paginated = payload?.data ?? []
  const total = payload?.total ?? 0
  const apiTotalPages = payload?.total_pages ?? 0

  const totalPagesForUi = total > 0 ? Math.max(1, apiTotalPages) : 0

  const from = total > 0 ? pageIndex * RECONCILIATION_PAGE_SIZE + 1 : 0
  const to = Math.min(
    (pageIndex + 1) * RECONCILIATION_PAGE_SIZE,
    total,
  )

  useEffect(() => {
    if (totalPagesForUi > 0 && pageIndex >= totalPagesForUi) {
      setPageIndex(totalPagesForUi - 1)
    }
  }, [pageIndex, setPageIndex, totalPagesForUi])

  const visibleIds = useMemo(() => paginated.map((t) => t.id), [paginated])
  const visibleSelectedCount = useMemo(
    () => visibleIds.filter((id) => selectedById.has(id)).length,
    [visibleIds, selectedById],
  )
  const allVisibleSelected =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length
  const someVisibleSelected =
    visibleSelectedCount > 0 && !allVisibleSelected
  const selectionCount = selectedById.size
  const hasSelectionsOnOtherPages =
    selectionCount > visibleSelectedCount
  const headerIndeterminate =
    someVisibleSelected ||
    (hasSelectionsOnOtherPages && !allVisibleSelected)

  const ticketRef = useCallback((t: Transaction) => {
    const ticket = t.ticketId.trim()
    if (ticket) return ticket
    const r = t.reference.trim()
    return r || t.id
  }, [])

  const toggleRow = useCallback((t: Transaction) => {
    const id = t.id
    const ref = ticketRef(t)
    setSelectedById((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, ref)
      return next
    })
  }, [ticketRef])

  const togglePage = useCallback(() => {
    setSelectedById((prev) => {
      const next = new Map(prev)
      const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))
      if (allSelected) {
        for (const id of visibleIds) next.delete(id)
      } else {
        for (const t of paginated) next.set(t.id, ticketRef(t))
      }
      return next
    })
  }, [paginated, ticketRef, visibleIds])

  const clearSelection = useCallback(() => {
    setSelectedById(new Map())
  }, [])

  const openEdit = (t: Transaction) => {
    setModalTx(t)
    setModalOpen(true)
  }

  const handleSave = async (id: string, patch: Partial<Transaction>) => {
    const prev = paginated.find((t) => t.id === id)
    if (!prev) return
    try {
      const updated = await TransactionsApi.adminUpdateTransactionById(id, {
        amount: patch.amount ?? prev.amount,
        channel: prev.channel,
        createdAt: prev.createdAt,
        vehicleType: vehicleTypeToApiPayload(
          patch.vehicleType ?? prev.vehicleType,
        ),
      } as Parameters<typeof TransactionsApi.adminUpdateTransactionById>[1])
      const ticket = ticketRef(prev)
      appendLog({
        action: 'reconciliation',
        summary: `Updated ${ticket}`,
        detail: `Ticket ${ticket}. ${describeTransactionPatchForLog(prev, patch, updated)}`,
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
      void queryClient.invalidateQueries({
        queryKey: dashboardOverviewQueryKey,
      })
      void queryClient.invalidateQueries({
        queryKey: settlementTransactionsQueryKey,
      })
      setModalOpen(false)
      setModalTx(null)
      toast.success('Transaction updated', {
        description: `Ticket ${ticket} saved.`,
      })
    } catch (e) {
      appendLog({
        action: 'settings',
        summary: `Save failed for ${ticketRef(prev)}`,
        detail: 'Could not update transaction on the server.',
      })
      toastRequestFailed('Could not save transaction', e)
    }
  }

  const handleConfirmDelete = useCallback(async () => {
    if (selectedById.size === 0 || deleting) return
    const ticketIds = [...new Set(Array.from(selectedById.values()))]
    setDeleting(true)
    try {
      await TransactionsApi.adminDeleteBulkTransactions(ticketIds)
      const preview = ticketIds.slice(0, 5).join(', ')
      const more =
        ticketIds.length > 5 ? ` (+${ticketIds.length - 5} more)` : ''
      appendLog({
        action: 'reconciliation',
        summary: `Deleted ${ticketIds.length} transaction${ticketIds.length === 1 ? '' : 's'}`,
        detail: `Bulk deleted on server - ticket IDs: ${preview}${more}`,
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
      void queryClient.invalidateQueries({
        queryKey: dashboardOverviewQueryKey,
      })
      void queryClient.invalidateQueries({
        queryKey: settlementTransactionsQueryKey,
      })
      setSelectedById(new Map())
      setConfirmOpen(false)
      toast.success(
        ticketIds.length === 1
          ? 'Transaction deleted'
          : `${ticketIds.length} transactions deleted`,
        {
          description: 'The ledger and dashboards will refresh momentarily.',
        },
      )
    } catch (e) {
      appendLog({
        action: 'settings',
        summary: 'Bulk delete failed',
        detail: 'Could not delete transactions on the server.',
      })
      toastRequestFailed('Could not delete transactions', e)
    } finally {
      setDeleting(false)
    }
  }, [appendLog, deleting, selectedById])

  return (
    <>
      <div className="min-w-0">
        <TableToolbar
          right={
            <>
              <span className="tabular-nums">
                {listQuery.isPending ? (
                  <span
                    className="inline-block h-4 w-36 animate-pulse rounded-md bg-zinc-200/80"
                    aria-hidden
                  />
                ) : listQuery.isError ? (
                  <span className="text-rose-700">Could not load</span>
                ) : (
                  <>
                    <span className="font-bold text-zinc-900">{total}</span>{' '}
                    row{total === 1 ? '' : 's'}
                    {query.trim() ? ' match' : ''}
                    {total > 0 && (
                      <>
                        {' '}
                        · showing <span className="tabular-nums">{from}–{to}</span>
                      </>
                    )}
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
            placeholder="Search ticket ID…"
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
                Selections persist across pages.
              </span>
            </p>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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

        <div
          className="overflow-x-auto"
          aria-busy={listQuery.isPending}
        >
          <table
            className="w-full min-w-[920px] border-collapse text-left text-sm"
            aria-label={
              listQuery.isPending
                ? 'Loading reconciliation rows'
                : 'Align every payment type'
            }
          >
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="w-10 whitespace-nowrap px-4 py-3.5">
                  <SelectAllCheckbox
                    checked={allVisibleSelected}
                    indeterminate={headerIndeterminate}
                    onChange={togglePage}
                    disabled={visibleIds.length === 0 || listQuery.isPending}
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
              {listQuery.isPending ? (
                <AdminTableSkeletonBody
                  rows={RECONCILIATION_PAGE_SIZE}
                  columns={6}
                  checkboxColumn
                  rightAlignIndices={[3, 5]}
                />
              ) : listQuery.isError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-rose-700"
                  >
                    Could not load transactions. Try again later.
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-zinc-500"
                  >
                    No transactions match
                    {query.trim() ? ` "${query.trim()}"` : ' your search'}.
                  </td>
                </tr>
              ) : (
                paginated.map((t) => {
                  const isSelected = selectedById.has(t.id)
                  const ticketLabel = ticketRef(t)
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
                          onChange={() => toggleRow(t)}
                          label={`Select transaction ${ticketLabel}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-zinc-900">
                        {ticketLabel}
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
                          className="rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-100 px-5 pb-5 pt-2">
          <AdminPagination
            page={uiPage}
            totalPages={totalPagesForUi}
            totalItems={total}
            pageSize={RECONCILIATION_PAGE_SIZE}
            onPageChange={(p) => setPageIndex(p - 1)}
          />
        </div>
      </div>

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
          deleting={deleting}
          onCancel={() => !deleting && setConfirmOpen(false)}
          onConfirm={() => void handleConfirmDelete()}
        />
      ) : null}
    </>
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
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmDeleteDialog({
  count,
  deleting,
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
        disabled={deleting}
        onClick={onCancel}
        className={adminModalBackdrop}
      />
      <div className={`${adminModalPanel} max-w-md`}>
        <div className={adminModalHeader}>
          <h2 id="confirm-delete-title" className={adminModalTitle}>
            Delete {count} transaction{count === 1 ? '' : 's'}?
          </h2>
          <p className={adminModalSubtitle}>
            This permanently deletes the selected row{count === 1 ? '' : 's'} on
            the server and writes an entry to the activity log. You cannot undo
            this.
          </p>
        </div>
        <div className={adminModalFooter}>
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className={adminBtnSecondary}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className={adminBtnDanger}
          >
            {deleting ? 'Deleting…' : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  )
}
