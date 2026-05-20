import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { toastRequestFailed } from '../../lib/apiErrors'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AdminPagination from '../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../components/admin/AdminTableSkeletonBody'
import TableSearchInput from '../../components/admin/TableSearchInput'
import TableToolbar from '../../components/admin/TableToolbar'
import TransactionDateFilterDropdown from '../../components/admin/TransactionDateFilterDropdown'
import { useAdminData } from '../../context/AdminDataContext'
import { useAdminPageAccess } from '../../hooks/useAdminPageAccess'
import { getAuditActorLabel } from '../../lib/auditActorLabel'
import { totalVolume } from '../../lib/dashboardStats'
import { channelLabel, channelPillClass } from '../../lib/channelStyles'
import { vehicleLabel, vehiclePillClass } from '../../lib/vehicleStyles'
import { formatDateShort, formatMoney } from '../../lib/formatters'
import { statusPillClass } from '../../lib/statusStyles'
import type { Transaction } from '../../types/transaction'
import {
  describeDateSelectionForExportLog,
  labelForMonthFilterValue,
  parseFilterValue,
  transactionsToCsv,
  type DateFilterSelection,
} from '../../lib/transactionDateFilter'
import {
  fetchTransactionsForExport,
  TRANSACTIONS_PAGE_SIZE,
  useTransactionsListQuery,
} from '../../query/transactionsList'

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function TransactionsPage() {
  const { appendLog } = useAdminData()
  const { canAccess } = useAdminPageAccess()
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [q, setQ] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [activeTx, setActiveTx] = useState<Transaction | null>(null)
  const [exporting, setExporting] = useState(false)
  const [filterValue, setFilterValue] = useState<string>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateSelection: DateFilterSelection = useMemo(() => {
    const parsed = parseFilterValue(filterValue, customStart, customEnd)
    if (parsed.kind === 'custom' && (!customStart.trim() || !customEnd.trim())) {
      return { kind: 'all' }
    }
    return parsed
  }, [filterValue, customStart, customEnd])

  const filterSummary = useMemo(() => {
    if (filterValue === 'all') return 'All time'
    if (filterValue === 'today') return 'Today'
    if (filterValue === '7d') return 'Last 7 days'
    if (filterValue === '30d') return 'Last 30 days'
    if (filterValue === 'custom') {
      if (!customStart || !customEnd) return 'Custom range (set dates)'
      return `Custom: ${customStart} → ${customEnd}`
    }
    if (filterValue.startsWith('month:')) {
      return labelForMonthFilterValue(filterValue) ?? 'Month'
    }
    return 'Month'
  }, [filterValue, customStart, customEnd])

  const customIncomplete =
    filterValue === 'custom' &&
    (!customStart.trim() || !customEnd.trim())

  const listQuery = useTransactionsListQuery(pageIndex, q, dateSelection)
  const payload = listQuery.data
  const rows = payload?.data ?? []
  const totalItems = payload?.total ?? 0
  const apiTotalPages = payload?.total_pages ?? 0

  const uiPage = pageIndex + 1
  const totalPagesForUi =
    totalItems > 0 ? Math.max(1, apiTotalPages) : 0

  const grand = useMemo(() => totalVolume(rows), [rows])

  useEffect(() => {
    setPageIndex(0)
  }, [q, dateSelection])

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
    if (exporting || totalItems === 0) return
    setExporting(true)
    try {
      const exported = await fetchTransactionsForExport(q, dateSelection)
      const csv = transactionsToCsv(
        exported.map((t) => ({
          reference: t.reference,
          customerName: t.customerName,
          vehicleType: vehicleLabel[t.vehicleType],
          channel: channelLabel[t.channel],
          amount: t.amount,
          status: t.status,
          createdAt: t.createdAt,
          notes: t.notes,
        })),
      )
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(`transactions-export-${stamp}.csv`, csv)
      const who = getAuditActorLabel()
      const exportTotal = totalVolume(exported)
      const dateRangeLine = describeDateSelectionForExportLog(dateSelection)
      const filterDesc = [
        dateRangeLine,
        q.trim() ? `search "${q.trim()}"` : 'no search',
      ].join('; ')
      appendLog({
        action: 'export',
        summary: `${who} exported transactions data`,
        detail: `${who} exported CSV - ${filterDesc}; total amount ${formatMoney(exportTotal)} (${exported.length} row${exported.length === 1 ? '' : 's'}).`,
      })
      toast.success('Export ready', {
        description: `${exported.length} row${exported.length === 1 ? '' : 's'} downloaded as CSV.`,
      })
    } catch (e) {
      toastRequestFailed('Export failed', e)
    } finally {
      setExporting(false)
    }
  }, [appendLog, dateSelection, exporting, q, totalItems])

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
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-zinc-200/90 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {dateSelection.kind === 'all' ? 'This page volume' : 'This page (filtered)'}
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-zinc-950">
                {formatMoney(grand)}
              </p>

            </div>
            {canAccess('settlement') ? (
              <Link
                to="/admin/settlement"
                className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-950 shadow-sm transition hover:border-sky-300 hover:bg-sky-100/90"
              >
                Settlement →
              </Link>
            ) : null}
          </div>
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
              />
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={
                  exporting ||
                  listQuery.isPending ||
                  totalItems === 0 ||
                  customIncomplete
                }
                title={
                  customIncomplete
                    ? 'Set start and end dates for a custom range'
                    : totalItems === 0
                      ? 'No rows match the current filters'
                      : exporting
                        ? 'Export in progress…'
                        : `Export up to ${Math.min(totalItems, 5000)} row(s) as CSV`
                }
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </>
          }
          footer={
            customIncomplete ? (
              <p className="text-sm text-amber-800">
                Open <strong>Date range</strong>, pick{' '}
                <strong>Custom range</strong>, set start and end, then press{' '}
                <strong>Done</strong>.
              </p>
            ) : null
          }
        >
          <TableSearchInput
            inputRef={searchInputRef}
            value={q}
            onChange={setQ}
            placeholder="Search ticket ID, customer, notes…"
            ariaLabel="Search transactions"
          />
        </TableToolbar>

        {listQuery.isError ? (
          <p className="px-5 py-6 text-sm text-rose-700">
            Could not load transactions.{' '}
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : 'Please try again.'}
          </p>
        ) : null}

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
                    No transactions match this search or date range.
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="transition hover:bg-orange-50/50">
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
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close transaction details"
            onClick={() => setActiveTx(null)}
            className="absolute inset-0 bg-zinc-950/55 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-details-title"
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_40px_120px_-30px_rgba(15,23,42,0.45)] ring-1 ring-zinc-950/5"
          >
            <div className="border-b border-zinc-100 bg-linear-to-br from-orange-50/95 via-white to-amber-50/60 px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700/90">
                    Transaction details
                  </p>
                  <h2
                    id="transaction-details-title"
                    className="mt-1.5 truncate font-mono text-lg font-bold text-zinc-950"
                    title={activeTx.reference}
                  >
                    {activeTx.reference}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-600">ID {activeTx.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTx(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusPillClass[activeTx.status]}`}
                >
                  {activeTx.status}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${channelPillClass[activeTx.channel]}`}
                >
                  {channelLabel[activeTx.channel]}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${vehiclePillClass[activeTx.vehicleType]}`}
                >
                  {vehicleLabel[activeTx.vehicleType]}
                </span>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5 sm:px-7">
              <div className="grid gap-4 sm:grid-cols-2">
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  )
}
