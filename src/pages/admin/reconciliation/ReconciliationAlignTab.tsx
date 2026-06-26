import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useAdminListPage } from '../../../hooks/useAdminListPage'
import { toast } from 'sonner'
import AdminPagination from '../../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../../components/admin/AdminTableSkeletonBody'
import AdminTableEmptyState from '../../../components/admin/AdminTableEmptyState'
import TableSearchInput from '../../../components/admin/TableSearchInput'
import TableToolbar from '../../../components/admin/TableToolbar'
import { useAdminData } from '../../../context/AdminDataContext'
import { channelLabel, channelPillClass } from '../../../lib/channelStyles'
import { vehicleLabel, vehiclePillClass } from '../../../lib/vehicleStyles'
import {
  formatDayStamp,
  formatMoney,
  formatTransactionLedgerTime,
  displayTransactionField,
} from '../../../lib/formatters'
import type { DateFilterSelection } from '../../../lib/transactionDateFilter'
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

/** A selected reconciliation row - ticket ref for bulk delete, amount for the running total. */
interface SelectedRow {
  ref: string
  amount: number
}

/** Strict `YYYY-MM-DD` check for the `?day=` search param. */
function isValidYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T12:00:00`)
  return !Number.isNaN(d.getTime())
}

export default function ReconciliationAlignTab() {
  const { appendLog } = useAdminData()

  const [searchParams, setSearchParams] = useSearchParams()
  const dayParam = useMemo(() => {
    const raw = searchParams.get('day')?.trim() ?? ''
    return isValidYmd(raw) ? raw : ''
  }, [searchParams])

  const setDay = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next && isValidYmd(next)) params.set('day', next)
          else params.delete('day')
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { pageIndex, setPageIndex, uiPage } = useAdminListPage([
    debouncedQuery,
    dayParam,
  ])
  /** Selected rows keyed by id - keeps ticket ref (for bulk delete) and amount (for the running total). */
  const [selectedById, setSelectedById] = useState<Map<string, SelectedRow>>(
    () => new Map(),
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /** Single-day filter on pay time (`createdAt`); empty = all dates. */
  const daySelection: DateFilterSelection = useMemo(() => {
    if (!dayParam) return { kind: 'all' }
    return { kind: 'custom', start: `${dayParam}T00:00:00`, end: `${dayParam}T23:59:59` }
  }, [dayParam])

  /** Datetime bounds so the API gets from=`day T00:00:00` and to=`day T23:59:59`. */
  const dayCustomDates = useMemo(
    () =>
      dayParam
        ? { from: `${dayParam}T00:00:00`, to: `${dayParam}T23:59:59` }
        : { from: '', to: '' },
    [dayParam],
  )

  const listQuery = useTransactionsListQuery(
    pageIndex,
    debouncedQuery,
    daySelection,
    RECONCILIATION_PAGE_SIZE,
    { channel: 'cash', customDates: dayCustomDates },
  )
  const payload = listQuery.data
  /** Cash payments only; the pay-time day is filtered server-side via `from`/`to`. */
  const paginated = useMemo(
    () => (payload?.data ?? []).filter((t) => t.channel === 'cash'),
    [payload],
  )
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
  const selectedTotal = useMemo(() => {
    let sum = 0
    for (const row of selectedById.values()) sum += row.amount
    return sum
  }, [selectedById])
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
      else next.set(id, { ref, amount: t.amount })
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
        for (const t of paginated) next.set(t.id, { ref: ticketRef(t), amount: t.amount })
      }
      return next
    })
  }, [paginated, ticketRef, visibleIds])

  const clearSelection = useCallback(() => {
    setSelectedById(new Map())
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (selectedById.size === 0 || deleting) return
    /** Delete by transaction `id` (UUID), not the ticket reference. */
    const ids = [...selectedById.keys()]
    const refs = [
      ...new Set(Array.from(selectedById.values(), (row) => row.ref)),
    ]
    setDeleting(true)
    try {
      await TransactionsApi.adminDeleteBulkTransactions(ids)
      const preview = refs.slice(0, 5).join(', ')
      const more = refs.length > 5 ? ` (+${refs.length - 5} more)` : ''
      appendLog({
        action: 'reconciliation',
        summary: `Deleted ${ids.length} transaction${ids.length === 1 ? '' : 's'}`,
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
        ids.length === 1
          ? 'Transaction deleted'
          : `${ids.length} transactions deleted`,
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
              <DayFilterDropdown value={dayParam} onChange={setDay} />
              <span aria-hidden className="text-zinc-300">·</span>
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
                    {selectionCount} selected · {formatMoney(selectedTotal)}
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <p className="text-sm font-semibold text-orange-900">
                {selectionCount} transaction{selectionCount === 1 ? '' : 's'} selected
                <span className="ml-2 text-xs font-medium text-orange-800/80">
                  Selections persist across pages.
                </span>
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-sm font-bold tabular-nums text-orange-900 ring-1 ring-orange-200">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700/80">
                  Selected total
                </span>
                {formatMoney(selectedTotal)}
              </span>
            </div>
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
            className="w-full min-w-[1500px] border-collapse text-left text-sm"
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
                <th className="whitespace-nowrap px-5 py-3.5">Pay ID</th>
                <th className="whitespace-nowrap px-5 py-3.5">Cashier</th>
                <th className="whitespace-nowrap px-5 py-3.5">Vehicle</th>
                <th className="whitespace-nowrap px-5 py-3.5">Payment type</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Amount</th>
                <th className="whitespace-nowrap px-5 py-3.5">Entry time</th>
                <th className="whitespace-nowrap px-5 py-3.5">Exit time</th>
                <th className="whitespace-nowrap px-5 py-3.5">Pay time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {listQuery.isPending ? (
                <AdminTableSkeletonBody
                  rows={RECONCILIATION_PAGE_SIZE}
                  columns={9}
                  checkboxColumn
                  rightAlignIndices={[5]}
                />
              ) : listQuery.isError ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-10 text-center text-sm text-rose-700"
                  >
                    Could not load transactions. Try again later.
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <AdminTableEmptyState colSpan={10} />
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
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-zinc-700">
                        {displayTransactionField(t.carfeeId)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-zinc-700">
                        {displayTransactionField(t.createdBy)}
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
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] tabular-nums text-zinc-600">
                        {formatTransactionLedgerTime(t.entryTime)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] tabular-nums text-zinc-600">
                        {formatTransactionLedgerTime(t.exitTime)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] tabular-nums text-zinc-600">
                        {formatTransactionLedgerTime(t.createdAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 pt-3">
          <label className="inline-flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-zinc-700">
            <SelectAllCheckbox
              checked={allVisibleSelected}
              indeterminate={headerIndeterminate}
              onChange={togglePage}
              disabled={visibleIds.length === 0 || listQuery.isPending}
              label="Select all rows on this page"
            />
            Select all on this page
          </label>
          {selectionCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1 text-sm font-bold tabular-nums text-orange-900 ring-1 ring-orange-200">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700/80">
                  {selectionCount} selected
                </span>
                {formatMoney(selectedTotal)}
              </span>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] font-semibold text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <div className="px-5 pb-5 pt-2">
          <AdminPagination
            page={uiPage}
            totalPages={totalPagesForUi}
            totalItems={total}
            pageSize={RECONCILIATION_PAGE_SIZE}
            onPageChange={(p) => setPageIndex(p - 1)}
          />
        </div>
      </div>

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

interface DayFilterDropdownProps {
  value: string
  onChange: (next: string) => void
}

function DayFilterDropdown({ value, onChange }: DayFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  /** Draft date kept local until "Done" commits it (so the request fires on Done, not on pick). */
  const [draft, setDraft] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const triggerLabel = value ? formatDayStamp(value) : 'All dates'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
          value
            ? 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100'
            : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-200 hover:bg-orange-50/40'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="max-w-[160px] truncate">{triggerLabel}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Filter by pay date"
          className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5"
        >
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Pay date
          </label>
          <input
            type="date"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setDraft('')
                onChange('')
                setOpen(false)
              }}
              disabled={!draft && !value}
              className="text-xs font-semibold text-zinc-500 underline-offset-2 transition hover:text-zinc-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        </div>
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
