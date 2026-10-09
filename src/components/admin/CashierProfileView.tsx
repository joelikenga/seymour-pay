import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import CashierChannelCard from './CashierChannelCard'
import TableSearchInput from './TableSearchInput'
import TableToolbar from './TableToolbar'
import AdminPagination from './AdminPagination'
import AdminTableEmptyState from './AdminTableEmptyState'
import TransactionDateFilterDropdown from './TransactionDateFilterDropdown'
import {
  computeSalesSummary,
  getMockTransactionsForCashier,
  type CashierAccount,
} from '../../lib/cashiersService'
import {
  formatMoney,
  formatTransactionLedgerTime,
} from '../../lib/formatters'
import { channelLabel, channelPillClass } from '../../lib/channelStyles'
import { vehicleLabel, vehiclePillClass } from '../../lib/vehicleStyles'
import {
  parseFilterValue,
  type DateFilterSelection,
} from '../../lib/transactionDateFilter'
import {
  labelForLedgerDateFilter,
  resolveTransactionsListApiDatetimeRange,
} from '../../lib/transactionLedgerFilters'
import {
  TRANSACTIONS_PAGE_SIZE,
  useTransactionsListQuery,
} from '../../query/transactionsList'
import type { Transaction } from '../../types/transaction'

interface CashierProfileViewProps {
  cashier: CashierAccount
  onBack: () => void
}

export default function CashierProfileView({
  cashier,
  onBack,
}: CashierProfileViewProps) {
  // Date filtering state
  const [filterValue, setFilterValue] = useState<string>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageIndex, setPageIndex] = useState(0)

  const effectiveCustomBounds = useMemo(
    () => ({ from: customStart, to: customEnd }),
    [customStart, customEnd],
  )

  const dateSelection: DateFilterSelection = useMemo(() => {
    const parsed = parseFilterValue(filterValue, customStart, customEnd)
    if (parsed.kind === 'custom' && (!customStart.trim() || !customEnd.trim())) {
      return { kind: 'all' }
    }
    return parsed
  }, [filterValue, customStart, customEnd])

  const filterSummary = useMemo(
    () => labelForLedgerDateFilter(filterValue, customStart, customEnd),
    [filterValue, customStart, customEnd],
  )

  const range = useMemo(
    () => resolveTransactionsListApiDatetimeRange(dateSelection, effectiveCustomBounds),
    [dateSelection, effectiveCustomBounds],
  )

  // Fetch transactions from API for this cashier
  const listQuery = useTransactionsListQuery(
    pageIndex,
    searchQuery,
    dateSelection,
    TRANSACTIONS_PAGE_SIZE,
    {
      cashier: cashier.username,
      customDates: effectiveCustomBounds,
    },
  )

  const apiRows = listQuery.data?.data ?? []
  const apiTotal = listQuery.data?.total ?? 0

  // Fallback to mock data if API returns empty
  const mockRows = useMemo(
    () => getMockTransactionsForCashier(cashier.username, range.from, range.to),
    [cashier.username, range.from, range.to],
  )

  const displayedTransactions: Transaction[] = useMemo(() => {
    if (apiRows.length > 0) return apiRows
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return mockRows.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.channel.toLowerCase().includes(q),
      )
    }
    return mockRows
  }, [apiRows, mockRows, searchQuery])

  // Compute sales summary for the 4 channel cards: Cash, POS, Transfer, USSD
  const allSalesForPeriod = useMemo(() => {
    if (apiRows.length > 0) return apiRows
    return mockRows
  }, [apiRows, mockRows])

  const salesSummary = useMemo(
    () => computeSalesSummary(allSalesForPeriod),
    [allSalesForPeriod],
  )

  const totalItems = apiTotal > 0 ? apiTotal : displayedTransactions.length
  const totalPages = Math.ceil(totalItems / TRANSACTIONS_PAGE_SIZE) || 1

  function handleApplyCustomRange(start: string, end: string) {
    setFilterValue('custom')
    setCustomStart(start)
    setCustomEnd(end)
    setPageIndex(0)
  }

  function handleExportCsv() {
    if (displayedTransactions.length === 0) {
      toast.error('No transactions to export for this range.')
      return
    }

    const headers = ['Ticket ID', 'Payment Channel', 'Vehicle Type', 'Amount (NGN)', 'Time', 'Created By']
    const rows = displayedTransactions.map((t) => [
      t.ticketId,
      t.channel.toUpperCase(),
      t.vehicleType,
      t.amount,
      t.createdAt,
      t.createdBy,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${cashier.username}_sales_${filterValue}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloaded sales CSV')
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5m0 0l7 7m-7-7l7-7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to all cashiers
        </button>
      </div>

      {/* Cashier Profile Header */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/30 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-7">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 text-lg font-bold text-white shadow-md shadow-orange-500/20 ring-4 ring-white">
              {cashier.username.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
                Cashier Account
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                {cashier.username}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Date Filter & Overview Section */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-950">
              Daily Sales by Payment Method
            </h2>
            <p className="text-xs text-zinc-500">
              Sales volume breakdown for {filterSummary}
            </p>
          </div>

          {/* Date Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <TransactionDateFilterDropdown
              filterValue={filterValue}
              onFilterChange={(v) => {
                setFilterValue(v)
                setPageIndex(0)
              }}
              triggerLabel={filterSummary}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
              onApplyCustomRange={handleApplyCustomRange}
              mode="full"
            />

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-zinc-800"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export Sales
            </button>
          </div>
        </div>

        {/* Cards showing All, Cash, POS, Transfer, and USSD */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          <CashierChannelCard
            channel="all"
            totals={{
              volume: salesSummary.grandVolume,
              count: salesSummary.totalCount,
              sharePct: 100,
            }}
          />
          <CashierChannelCard channel="cash" totals={salesSummary.cash} />
          <CashierChannelCard channel="pos" totals={salesSummary.pos} />
          <CashierChannelCard channel="transfer" totals={salesSummary.transfer} />
          <CashierChannelCard channel="ussd" totals={salesSummary.ussd} />
        </div>
      </section>

      {/* Sales Transactions Ledger */}
      <section className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_8px_40px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5">
        <TableToolbar
          right={
            <span className="tabular-nums text-xs">
              <span className="font-bold text-zinc-900">{displayedTransactions.length}</span>{' '}
              {displayedTransactions.length === 1 ? 'sale' : 'sales'} listed
            </span>
          }
        >
          <TableSearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v)
              setPageIndex(0)
            }}
            placeholder="Search ticket code or vehicle…"
            ariaLabel="Search cashier sales"
          />
        </TableToolbar>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {displayedTransactions.length === 0 ? (
                <AdminTableEmptyState
                  colSpan={6}
                  message={`No completed sales found for ${cashier.username} matching the selected filter.`}
                />
              ) : (
                displayedTransactions.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-zinc-50/80">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-bold text-zinc-900">
                      {t.ticketId || t.code}
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
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold tabular-nums text-zinc-950">
                      {formatMoney(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] tabular-nums text-zinc-600">
                      {formatTransactionLedgerTime(t.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-100 px-5 pb-5 pt-3">
          <AdminPagination
            page={pageIndex + 1}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={TRANSACTIONS_PAGE_SIZE}
            onPageChange={(p) => setPageIndex(p - 1)}
          />
        </div>
      </section>
    </div>
  )
}
