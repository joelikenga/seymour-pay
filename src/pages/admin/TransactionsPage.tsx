import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAdminListPage } from '../../hooks/useAdminListPage'
import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminPagination from '../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../components/admin/AdminTableSkeletonBody'
import TableSearchInput from '../../components/admin/TableSearchInput'
import TableToolbar from '../../components/admin/TableToolbar'
import TransactionDateFilterDropdown from '../../components/admin/TransactionDateFilterDropdown'
import { useAdminData } from '../../context/AdminDataContext'
import { getAuditActorLabel } from '../../lib/auditActorLabel'
import { channelLabel, channelPillClass } from '../../lib/channelStyles'
import { vehicleLabel, vehiclePillClass } from '../../lib/vehicleStyles'
import { formatDateShort, formatMoney } from '../../lib/formatters'
import { statusPillClass } from '../../lib/statusStyles'
import type { Transaction } from '../../types/transaction'
import {
  dateSelectionToQueryKey,
  dateSelectionToTransactionsApiRange,
  defaultTransactionFilterYear,
  describeDateSelectionForExportLog,
  labelForTransactionDateFilter,
  parseFilterValue,
  type DateFilterSelection,
} from '../../lib/transactionDateFilter'
import {
  TRANSACTIONS_PAGE_SIZE,
  useTransactionsListQuery,
} from '../../query/transactionsList'
import { labelForExportFormat } from '../../lib/exportTransactionsFormat'
import { TransactionsApi } from '../../utils'
import {
  adminModalBackdrop,
  adminModalBody,
  adminModalCloseBtn,
  adminModalHeader,
  adminModalPanel,
  adminModalSubtitle,
  adminModalTitle,
} from '../../lib/adminModalStyles'

export default function TransactionsPage() {
  const { appendLog } = useAdminData()
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 300)
  const [activeTx, setActiveTx] = useState<Transaction | null>(null)
  const [exporting, setExporting] = useState(false)
  const [filterValue, setFilterValue] = useState<string>(() => {
    const now = new Date()
    const year = defaultTransactionFilterYear(now)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `month:${year}-${month}`
  })
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateSelection: DateFilterSelection = useMemo(() => {
    const parsed = parseFilterValue(filterValue, customStart, customEnd)
    if (parsed.kind === 'custom' && (!customStart.trim() || !customEnd.trim())) {
      return { kind: 'all' }
    }
    return parsed
  }, [filterValue, customStart, customEnd])

  const filterSummary = useMemo(
    () => labelForTransactionDateFilter(filterValue, customStart, customEnd),
    [filterValue, customStart, customEnd],
  )

  const { pageIndex, setPageIndex, uiPage } = useAdminListPage([
    debouncedQ,
    dateSelectionToQueryKey(dateSelection),
  ])

  const listQuery = useTransactionsListQuery(pageIndex, debouncedQ, dateSelection)
  const payload = listQuery.data
  const rows = payload?.data ?? []
  const totalItems = payload?.total ?? 0
  const apiTotalPages = payload?.total_pages ?? 0

  const totalPagesForUi =
    totalItems > 0 ? Math.max(1, apiTotalPages) : 0

  useEffect(() => {
    if (totalPagesForUi > 0 && pageIndex >= totalPagesForUi) {
      setPageIndex(totalPagesForUi - 1)
    }
  }, [pageIndex, setPageIndex, totalPagesForUi])

  useEffect(() => {
    const st = location.state as { focusSearch?: boolean } | null
    if (st?.focusSearch) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
      navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: {} },
      )
      return
    }
    const params = new URLSearchParams(location.search)
    if (params.get('focusSearch') === '1') {
      requestAnimationFrame(() => searchInputRef.current?.focus())
      params.delete('focusSearch')
      const next = params.toString()
      navigate(
        { pathname: location.pathname, search: next ? `?${next}` : '' },
        { replace: true },
      )
    }
  }, [location.state, location.pathname, location.search, navigate])

  const handleExport = useCallback(async () => {
    if (exporting) return
    const exportFormat = 'csv' as const
    setExporting(true)
    try {
      const range = dateSelectionToTransactionsApiRange(dateSelection)
      if (!range.from || !range.to) {
        throw new Error(
          'Pick a date range before exporting. All-time exports are too large for the server.',
        )
      }
      const blob = await TransactionsApi.adminExportTransactions({
        type: exportFormat,
        status: 'completed',
        from: range.from,
        to: range.to,
      })
      const filename = `${exportFilenameBase(dateSelection, range)}.${exportFormat}`
      TransactionsApi.downloadTransactionExportFile(filename, blob)
      const formatLabel = labelForExportFormat(exportFormat)
      const who = getAuditActorLabel()
      const dateRangeLine = describeDateSelectionForExportLog(dateSelection)
      appendLog({
        action: 'export',
        summary: `${who} exported transactions data`,
        detail: `${who} exported ${formatLabel} (${filename}) - ${dateRangeLine}.`,
      })
      toast.success('Export ready', {
        description: `Downloaded ${filename}.`,
      })
    } catch (e) {
      const message =
        e instanceof Error && e.message.trim()
          ? e.message.trim()
          : 'Something went wrong. Please try again.'
      toast.error('Export failed', { description: message })
    } finally {
      setExporting(false)
    }
  }, [appendLog, dateSelection, exporting])

  useEffect(() => {
    if (!activeTx) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveTx(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTx])

  useEffect(() => {
    if (!activeTx) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [activeTx])

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
            Ledger
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Transactions
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Full history across every payment type.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_8px_40px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5">
        <TableToolbar
          right={
            <>
              <span className="tabular-nums">
                <span className="font-bold text-zinc-900">{totalItems}</span>{' '}
                match{totalItems === 1 ? '' : 'es'}
              </span>
              <span aria-hidden className="text-zinc-300">·</span>
              <TransactionDateFilterDropdown
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                triggerLabel={filterSummary}
                customStart={customStart}
                customEnd={customEnd}
                onCustomStartChange={setCustomStart}
                onCustomEndChange={setCustomEnd}
                mode="monthQuarter"
              />
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={listQuery.isPending || exporting}
                aria-label="Export transactions as CSV"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 opacity-90"
                  aria-hidden
                >
                  <path
                    d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {exporting ? 'Exporting…' : 'Export'}
              </button>
            </>
          }
        >
          <TableSearchInput
            inputRef={searchInputRef}
            value={q}
            onChange={setQ}
            placeholder="Search ticket ID…"
            ariaLabel="Search transactions"
          />
        </TableToolbar>

        <div
          className="overflow-x-auto"
          aria-busy={listQuery.isPending}
        >
          <table
            className="w-full min-w-[880px] border-collapse text-left text-sm"
            aria-label={listQuery.isPending ? 'Loading transactions' : 'Transactions'}
          >
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="whitespace-nowrap px-5 py-3.5">Ticket ID</th>
                <th className="whitespace-nowrap px-5 py-3.5">Vehicle</th>
                <th className="whitespace-nowrap px-5 py-3.5">Payment type</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">
                  Amount
                </th>
                <th className="whitespace-nowrap px-5 py-3.5">Date</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {listQuery.isPending ? (
                <AdminTableSkeletonBody
                  rows={TRANSACTIONS_PAGE_SIZE}
                  columns={6}
                  rightAlignIndices={[3, 5]}
                />
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-zinc-500"
                  >
                    No transactions match this ticket ID or date range.
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="transition hover:bg-orange-50/50">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-zinc-900">
                      {t.ticketId || t.reference}
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
                        onClick={() => setActiveTx(t)}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
                      >
                        Click to view
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-100 px-5 pb-5 pt-2">
          <AdminPagination
            page={uiPage}
            totalPages={totalPagesForUi}
            totalItems={totalItems}
            pageSize={TRANSACTIONS_PAGE_SIZE}
            onPageChange={(p) => setPageIndex(p - 1)}
          />
        </div>
      </section>

      {activeTx ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close transaction details"
            onClick={() => setActiveTx(null)}
            className={adminModalBackdrop}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-details-title"
            className={`${adminModalPanel} max-w-lg`}
          >
            <div className={adminModalHeader}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="transaction-details-title" className={adminModalTitle}>
                    Transaction details
                  </h2>
                  <p className={`${adminModalSubtitle} truncate font-mono`} title={activeTx.ticketId || activeTx.reference}>
                    {activeTx.ticketId || activeTx.reference}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTx(null)}
                  className={adminModalCloseBtn}
                >
                  Close
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ring-1 ring-inset ${statusPillClass[activeTx.status]}`}
                >
                  {activeTx.status}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ring-1 ring-inset ${channelPillClass[activeTx.channel]}`}
                >
                  {channelLabel[activeTx.channel]}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ring-1 ring-inset ${vehiclePillClass[activeTx.vehicleType]}`}
                >
                  {vehicleLabel[activeTx.vehicleType]}
                </span>
              </div>
            </div>

            <div className={`${adminModalBody} space-y-4`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Customer" value={activeTx.customerName} />
                <DetailRow label="Amount" value={formatMoney(activeTx.amount)} />
                <DetailRow label="Date" value={formatDateShort(activeTx.createdAt)} />
                <DetailRow label="Payment type" value={channelLabel[activeTx.channel]} />
              </div>
              <DetailRow
                label="Notes"
                value={activeTx.notes?.trim() ? activeTx.notes : 'No notes'}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Download filename base from the selected date range, e.g.
 * "quarter 1 transactions", "june 2026 transactions", "all time transactions".
 */
function exportFilenameBase(
  selection: DateFilterSelection,
  range: { from?: string; to?: string },
): string {
  switch (selection.kind) {
    case 'today':
      return 'today transactions'
    case '7d':
      return 'last 7 days transactions'
    case '30d':
      return 'last 30 days transactions'
    case 'month': {
      const label = new Date(selection.year, selection.monthIndex, 15)
        .toLocaleString(undefined, { month: 'long', year: 'numeric' })
        .toLowerCase()
      return `${label} transactions`
    }
    case 'quarter':
      return `quarter ${selection.quarter} transactions`
    case 'custom':
      if (range.from && range.to) {
        return `${range.from} to ${range.to} transactions`
      }
      return 'custom range transactions'
    default:
      return 'all time transactions'
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-2.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}
