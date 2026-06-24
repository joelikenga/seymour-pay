import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminListPage } from '../../hooks/useAdminListPage'
import { useTransactionLedgerUrlFilters } from '../../hooks/useTransactionLedgerUrlFilters'
import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminPagination from '../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../components/admin/AdminTableSkeletonBody'
import AdminTableEmptyState from '../../components/admin/AdminTableEmptyState'
import TableSearchInput from '../../components/admin/TableSearchInput'
import TableToolbar from '../../components/admin/TableToolbar'
import TransactionDateFilterDropdown from '../../components/admin/TransactionDateFilterDropdown'
import TransactionCashierFilterPicker from '../../components/admin/TransactionCashierFilterPicker'
import { useAdminData } from '../../context/AdminDataContext'
import { getAuditActorLabel } from '../../lib/auditActorLabel'
import { channelLabel, channelPillClass } from '../../lib/channelStyles'
import { vehicleLabel, vehiclePillClass } from '../../lib/vehicleStyles'
import {
  displayTransactionField,
  formatMoney,
  formatTransactionLedgerTime,
} from '../../lib/formatters'
import {
  describeDateSelectionForExportLog,
  parseFilterValue,
  type DateFilterSelection,
} from '../../lib/transactionDateFilter'
import {
  cashiersApiRangeKey,
  labelForLedgerDateFilter,
  resolveTransactionsListApiDatetimeRange,
  transactionsListFiltersQueryKey,
} from '../../lib/transactionLedgerFilters'
import {
  TRANSACTIONS_PAGE_SIZE,
  useTransactionsListQuery,
} from '../../query/transactionsList'
import { useTransactionCashiersQuery } from '../../query/transactionCashiers'
import { useAdminProfileQuery } from '../../query/adminProfile'
import { isSuperAdminRole } from '../../lib/adminRole'
import { labelForExportFormat } from '../../lib/exportTransactionsFormat'
import { TransactionsApi } from '../../utils'

export type AdminTransactionsLedgerVariant = 'transactions' | 'lostTickets'

const LEDGER_PAGE_COPY: Record<
  AdminTransactionsLedgerVariant,
  {
    eyebrow: string
    title: string
    subtitle: string
    exportAriaLabel: string
    exportLogSummary: string
    searchAriaLabel: string
    tableAriaBusy: string
    tableAriaReady: string
  }
> = {
  transactions: {
    eyebrow: 'Ledger',
    title: 'Transactions',
    subtitle: 'Full history across every payment type.',
    exportAriaLabel: 'Export transactions as CSV',
    exportLogSummary: 'exported transactions data',
    searchAriaLabel: 'Search transactions',
    tableAriaBusy: 'Loading transactions',
    tableAriaReady: 'Transactions',
  },
  lostTickets: {
    eyebrow: 'Ledger',
    title: 'Lost tickets',
    subtitle: 'Lost-ticket payments only - separate from the main Transactions ledger.',
    exportAriaLabel: 'Export lost tickets as CSV',
    exportLogSummary: 'exported lost ticket data',
    searchAriaLabel: 'Search lost tickets',
    tableAriaBusy: 'Loading lost tickets',
    tableAriaReady: 'Lost tickets',
  },
}

interface AdminTransactionsLedgerPageProps {
  variant: AdminTransactionsLedgerVariant
}

export default function AdminTransactionsLedgerPage({
  variant,
}: AdminTransactionsLedgerPageProps) {
  const copy = LEDGER_PAGE_COPY[variant]
  const lostTicketOnly = variant === 'lostTickets'
  const profileQuery = useAdminProfileQuery()
  const profileReady = profileQuery.isSuccess
  const isSuperAdmin =
    profileReady && isSuperAdminRole(profileQuery.data?.role)
  /** Cashier filter + column: transactions ledger only, after profile confirms superadmin. */
  const showCashierUi = variant === 'transactions' && isSuperAdmin
  const showCashierColumn = lostTicketOnly || showCashierUi
  const showCustomDateFilter = isSuperAdmin
  const accessResolved = profileReady
  const { appendLog } = useAdminData()
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    filterValue,
    setFilterValue,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    cashierFilter,
    setCashierFilter,
    q,
    setQ,
    debouncedQ,
  } = useTransactionLedgerUrlFilters({
    showCashierFilter: showCashierUi,
    showCustomDateFilter,
    accessResolved,
  })

  const [exporting, setExporting] = useState(false)

  const effectiveCustomDateBounds = useMemo(
    () =>
      showCustomDateFilter
        ? { from: customStart, to: customEnd }
        : { from: '', to: '' },
    [showCustomDateFilter, customStart, customEnd],
  )
  const customDatePartial =
    showCustomDateFilter &&
    ((customStart.trim() && !customEnd.trim()) ||
      (!customStart.trim() && customEnd.trim()))

  const dateSelection: DateFilterSelection = useMemo(() => {
    const parsed = parseFilterValue(
      filterValue,
      effectiveCustomDateBounds.from,
      effectiveCustomDateBounds.to,
    )
    if (
      parsed.kind === 'custom' &&
      (!effectiveCustomDateBounds.from.trim() ||
        !effectiveCustomDateBounds.to.trim())
    ) {
      return { kind: 'all' }
    }
    return parsed
  }, [filterValue, effectiveCustomDateBounds])

  const cashiersApiRange = useMemo(
    () =>
      resolveTransactionsListApiDatetimeRange(
        dateSelection,
        effectiveCustomDateBounds,
      ),
    [dateSelection, effectiveCustomDateBounds],
  )
  const cashiersRangeKey = useMemo(
    () => cashiersApiRangeKey(cashiersApiRange),
    [cashiersApiRange],
  )

  const cashiersQuery = useTransactionCashiersQuery(
    cashiersApiRange,
    showCashierUi,
  )
  const cashierNames: string[] =
    cashiersRangeKey && cashiersQuery.data ? cashiersQuery.data : []

  useEffect(() => {
    if (!showCashierUi) return
    setCashierFilter('all')
  }, [cashiersRangeKey, setCashierFilter, showCashierUi])

  useEffect(() => {
    if (!showCashierUi || cashierFilter === 'all') return
    if (!cashiersRangeKey || cashiersQuery.isFetching) return
    if (cashierNames.length === 0) return
    const selected = cashierFilter.trim()
    const exists = cashierNames.some(
      (name) => name.toLowerCase() === selected.toLowerCase(),
    )
    if (!exists) setCashierFilter('all')
  }, [
    cashierFilter,
    cashierNames,
    cashiersQuery.isFetching,
    cashiersRangeKey,
    showCashierUi,
  ])

  const ledgerColumnCount = useMemo(() => {
    if (lostTicketOnly) return 6
    return showCashierUi ? 9 : 8
  }, [lostTicketOnly, showCashierUi])

  const amountColumnIndex = lostTicketOnly ? 4 : showCashierUi ? 5 : 4

  const transactionsTableReady = lostTicketOnly || profileReady

  const filterSummary = useMemo(
    () =>
      labelForLedgerDateFilter(
        filterValue,
        effectiveCustomDateBounds.from,
        effectiveCustomDateBounds.to,
      ),
    [filterValue, effectiveCustomDateBounds],
  )

  const { pageIndex, setPageIndex, uiPage } = useAdminListPage([
    debouncedQ,
    transactionsListFiltersQueryKey(
      dateSelection,
      effectiveCustomDateBounds,
      showCashierUi ? cashierFilter : '',
    ),
    variant,
    isSuperAdmin ? 'superadmin' : 'admin',
  ])

  const listQuery = useTransactionsListQuery(
    pageIndex,
    debouncedQ,
    dateSelection,
    TRANSACTIONS_PAGE_SIZE,
    lostTicketOnly
      ? {
          lostTicketOnly: true,
          customDates: effectiveCustomDateBounds,
        }
      : {
          ...(showCashierUi ? { cashier: cashierFilter } : {}),
          customDates: effectiveCustomDateBounds,
        },
  )
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
      const range = resolveTransactionsListApiDatetimeRange(
        dateSelection,
        effectiveCustomDateBounds,
      )
      if (!range.from || !range.to) {
        throw new Error(
          'Pick a date range before exporting. All-time exports are too large for the server.',
        )
      }
      const cashier = cashierFilter.trim()
      const search = debouncedQ.trim()
      const blob = await TransactionsApi.adminExportTransactions({
        type: exportFormat,
        status: 'completed',
        from: range.from,
        to: range.to,
        is_lost_ticket: lostTicketOnly,
        ...(showCashierUi && cashier && cashier !== 'all'
          ? { created_by: cashier }
          : {}),
        ...(search ? { search } : {}),
      })
      const filename = `${exportFilenameBase(dateSelection, range, variant)}.${exportFormat}`
      TransactionsApi.downloadTransactionExportFile(filename, blob)
      const formatLabel = labelForExportFormat(exportFormat)
      const who = getAuditActorLabel()
      const dateRangeLine = describeDateSelectionForExportLog(dateSelection)
      appendLog({
        action: 'export',
        summary: `${who} ${copy.exportLogSummary}`,
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
  }, [
    appendLog,
    cashierFilter,
    copy.exportLogSummary,
    debouncedQ,
    effectiveCustomDateBounds,
    dateSelection,
    exporting,
    lostTicketOnly,
    showCashierUi,
    variant,
  ])

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            {copy.subtitle}
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
              {showCashierUi ? (
                <>
                  <TransactionCashierFilterPicker
                    key={cashiersRangeKey || 'no-range'}
                    value={cashierFilter}
                    onChange={setCashierFilter}
                    names={cashierNames}
                    loading={cashiersQuery.isFetching}
                    dateRangeLabel={filterSummary}
                  />
                  <span aria-hidden className="text-zinc-300">·</span>
                </>
              ) : null}
              <TransactionDateFilterDropdown
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                triggerLabel={filterSummary}
                customStart={customStart}
                customEnd={customEnd}
                onCustomStartChange={setCustomStart}
                onCustomEndChange={setCustomEnd}
                mode={showCustomDateFilter ? 'monthQuarterCustom' : 'monthQuarter'}
              />
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={listQuery.isPending || exporting}
                aria-label={copy.exportAriaLabel}
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
            ariaLabel={copy.searchAriaLabel}
          />
        </TableToolbar>
        {customDatePartial ? (
          <p className="border-b border-zinc-100 px-5 pb-4 text-sm text-amber-800">
            Open <strong>Date range</strong>, set both <strong>From</strong> and{' '}
            <strong>To</strong> date &amp; time, then click <strong>Filter</strong>.
          </p>
        ) : null}

        <div
          className="overflow-x-auto"
          aria-busy={listQuery.isPending}
        >
          <table
            className={`w-full border-collapse text-left text-sm ${
              lostTicketOnly
                ? 'min-w-[720px]'
                : showCashierUi
                  ? 'min-w-[1400px]'
                  : 'min-w-[1240px]'
            }`}
            aria-label={
              listQuery.isPending ? copy.tableAriaBusy : copy.tableAriaReady
            }
          >
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="whitespace-nowrap px-5 py-3.5">
                  {lostTicketOnly ? 'Code' : 'Ticket ID'}
                </th>
                {!lostTicketOnly ? (
                  <th className="whitespace-nowrap px-5 py-3.5">Pay ID</th>
                ) : null}
                {showCashierColumn ? (
                  <th className="whitespace-nowrap px-5 py-3.5">Cashier</th>
                ) : null}
                <th className="whitespace-nowrap px-5 py-3.5">Vehicle</th>
                <th className="whitespace-nowrap px-5 py-3.5">Payment type</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">
                  Amount
                </th>
                {!lostTicketOnly ? (
                  <>
                    <th className="whitespace-nowrap px-5 py-3.5">Entry time</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Exit time</th>
                  </>
                ) : null}
                <th className="whitespace-nowrap px-5 py-3.5">Pay time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {!transactionsTableReady || listQuery.isPending ? (
                <AdminTableSkeletonBody
                  rows={TRANSACTIONS_PAGE_SIZE}
                  columns={ledgerColumnCount}
                  rightAlignIndices={[amountColumnIndex]}
                />
              ) : rows.length === 0 ? (
                <AdminTableEmptyState colSpan={ledgerColumnCount} />
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="transition hover:bg-orange-50/50">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-zinc-900">
                      {lostTicketOnly
                        ? displayTransactionField(t.code)
                        : t.ticketId || t.reference}
                    </td>
                    {!lostTicketOnly ? (
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-zinc-700">
                        {displayTransactionField(t.carfeeId)}
                      </td>
                    ) : null}
                    {showCashierColumn ? (
                      <td className="whitespace-nowrap px-5 py-3.5 text-zinc-700">
                        {displayTransactionField(t.createdBy)}
                      </td>
                    ) : null}
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
                    {!lostTicketOnly ? (
                      <>
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] tabular-nums text-zinc-600">
                          {formatTransactionLedgerTime(t.entryTime)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] tabular-nums text-zinc-600">
                          {formatTransactionLedgerTime(t.exitTime)}
                        </td>
                      </>
                    ) : null}
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] tabular-nums text-zinc-600">
                      {formatTransactionLedgerTime(t.createdAt)}
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
    </div>
  )
}

function exportFilenameBase(
  selection: DateFilterSelection,
  range: { from?: string; to?: string },
  variant: AdminTransactionsLedgerVariant,
): string {
  const prefix = variant === 'lostTickets' ? 'lost tickets' : 'transactions'

  switch (selection.kind) {
    case 'today':
      return `today ${prefix}`
    case '7d':
      return `last 7 days ${prefix}`
    case '30d':
      return `last 30 days ${prefix}`
    case 'month': {
      const label = new Date(selection.year, selection.monthIndex, 15)
        .toLocaleString(undefined, { month: 'long', year: 'numeric' })
        .toLowerCase()
      return `${label} ${prefix}`
    }
    case 'quarter':
      return `quarter ${selection.quarter} ${prefix}`
    case 'custom':
      if (range.from && range.to) {
        return `${range.from} to ${range.to} ${prefix}`
      }
      return `custom range ${prefix}`
    default:
      return `all time ${prefix}`
  }
}
