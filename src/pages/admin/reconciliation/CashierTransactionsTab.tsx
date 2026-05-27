import { useEffect, useMemo, useState } from 'react'
import AdminPagination from '../../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../../components/admin/AdminTableSkeletonBody'
import CashpointCard from '../../../components/admin/CashpointCard'
import TransactionDateFilterDropdown from '../../../components/admin/TransactionDateFilterDropdown'
import { cashierFirstName } from '../../../lib/cashierDisplay'
import { channelLabel, channelPillClass } from '../../../lib/channelStyles'
import { formatDateShort, formatMoney } from '../../../lib/formatters'
import {
  dateSelectionToApiRange,
  labelForTransactionDateFilter,
  parseFilterValue,
  type DateFilterSelection,
} from '../../../lib/transactionDateFilter'
import { vehicleLabel, vehiclePillClass } from '../../../lib/vehicleStyles'
import type { CashierTransaction, CashpointSummary } from '../../../types/reconciliation'
import {
  CASHIER_TX_PAGE_SIZE,
  useCashpointSummariesQuery,
  useCashpointTransactionsQuery,
} from '../../../query/reconciliation'

export default function CashierTransactionsTab() {
  const [filterValue, setFilterValue] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedCashpoint, setSelectedCashpoint] =
    useState<CashpointSummary | null>(null)
  const [pageIndex, setPageIndex] = useState(0)

  const dateSelection: DateFilterSelection = useMemo(() => {
    const parsed = parseFilterValue(filterValue, customStart, customEnd)
    if (
      parsed.kind === 'custom' &&
      (!customStart.trim() || !customEnd.trim())
    ) {
      return { kind: 'all' }
    }
    return parsed
  }, [filterValue, customStart, customEnd])

  const apiRange = useMemo(
    () => dateSelectionToApiRange(dateSelection),
    [dateSelection],
  )

  const customIncomplete =
    filterValue === 'custom' && (!customStart.trim() || !customEnd.trim())

  const summariesQuery = useCashpointSummariesQuery(apiRange, !customIncomplete)
  const txQuery = useCashpointTransactionsQuery(
    selectedCashpoint?.id ?? null,
    pageIndex,
    apiRange,
    !customIncomplete,
  )

  const cashpoints = summariesQuery.data ?? []
  const txRows: CashierTransaction[] = txQuery.data?.data ?? []
  const txTotal = txQuery.data?.total ?? 0
  const filteredVolume = txQuery.data?.filtered_volume ?? 0
  const totalPages =
    txTotal > 0 ? Math.max(1, txQuery.data?.total_pages ?? 0) : 0
  const from = txTotal > 0 ? pageIndex * CASHIER_TX_PAGE_SIZE + 1 : 0
  const to = Math.min((pageIndex + 1) * CASHIER_TX_PAGE_SIZE, txTotal)

  useEffect(() => {
    setPageIndex(0)
  }, [selectedCashpoint?.id, dateSelection])

  const filterSummary = useMemo(
    () => labelForTransactionDateFilter(filterValue, customStart, customEnd),
    [filterValue, customStart, customEnd],
  )

  const dateFilterControl = (
    <TransactionDateFilterDropdown
      filterValue={filterValue}
      onFilterChange={setFilterValue}
      triggerLabel={filterSummary}
      customStart={customStart}
      customEnd={customEnd}
      onCustomStartChange={setCustomStart}
      onCustomEndChange={setCustomEnd}
    />
  )

  if (selectedCashpoint) {
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => {
              setSelectedCashpoint(null)
              setPageIndex(0)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            All cashpoints
          </button>
          <p className="text-sm font-semibold text-zinc-700">
            {selectedCashpoint.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-linear-to-r from-white to-zinc-50/90 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            {txQuery.isPending ? (
              <span className="text-sm text-zinc-500">Loading…</span>
            ) : txQuery.isError ? (
              <span className="text-sm text-rose-700">
                Could not load transactions
              </span>
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="text-sm text-zinc-600">
                  <span className="font-bold text-zinc-950">{txTotal}</span>{' '}
                  transaction{txTotal === 1 ? '' : 's'}
                  {txTotal > 0 ? (
                    <>
                      {' '}
                      ·{' '}
                      <span className="tabular-nums">
                        {from}–{to}
                      </span>
                    </>
                  ) : null}
                </p>
                <p className="text-sm font-semibold tabular-nums text-zinc-950">
                  Total{' '}
                  <span className="text-orange-800">
                    {formatMoney(filteredVolume)}
                  </span>
                </p>
              </div>
            )}
          </div>
          {dateFilterControl}
        </div>

        {customIncomplete ? (
          <p className="border-b border-amber-100 bg-amber-50/60 px-5 py-3 text-sm text-amber-800">
            Set a custom date &amp; time range using the filter above.
          </p>
        ) : null}

        <div className="overflow-x-auto" aria-busy={txQuery.isPending}>
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="whitespace-nowrap px-5 py-3.5">Ticket ID</th>
                <th className="whitespace-nowrap px-5 py-3.5">Cashier</th>
                <th className="whitespace-nowrap px-5 py-3.5">Vehicle</th>
                <th className="whitespace-nowrap px-5 py-3.5">Payment type</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Amount</th>
                <th className="whitespace-nowrap px-5 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {txQuery.isPending ? (
                <AdminTableSkeletonBody
                  rows={CASHIER_TX_PAGE_SIZE}
                  columns={6}
                  rightAlignIndices={[4]}
                />
              ) : txQuery.isError ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-rose-700"
                  >
                    {txQuery.error instanceof Error
                      ? txQuery.error.message
                      : 'Could not load transactions.'}
                  </td>
                </tr>
              ) : txRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-zinc-500"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                txRows.map((t) => (
                  <tr key={t.id} className="hover:bg-orange-50/40">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px]">
                      {t.reference}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-zinc-800">
                      {cashierFirstName({
                        firstName: t.cashierName,
                        displayName: t.cashierName,
                      })}
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
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums">
                      {formatMoney(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-zinc-600">
                      {formatDateShort(t.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-100 px-5 pb-5 pt-2">
          <AdminPagination
            page={pageIndex + 1}
            totalPages={totalPages}
            totalItems={txTotal}
            pageSize={CASHIER_TX_PAGE_SIZE}
            onPageChange={(p) => setPageIndex(p - 1)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <p className="text-sm font-semibold text-zinc-700">Cashpoints</p>
        {dateFilterControl}
      </div>

      {customIncomplete ? (
        <p className="mb-4 text-sm text-amber-800">
          Set a custom date range using the filter above.
        </p>
      ) : null}

      {summariesQuery.isPending ? (
        <p className="text-sm text-zinc-500" aria-live="polite">
          Loading cashpoints…
        </p>
      ) : summariesQuery.isError ? (
        <p className="text-sm text-rose-700">
          Could not load cashpoints.{' '}
          {summariesQuery.error instanceof Error
            ? summariesQuery.error.message
            : 'Try again later.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cashpoints.map((cp) => (
            <CashpointCard
              key={cp.id}
              cashpoint={cp}
              selected={false}
              onSelect={() => setSelectedCashpoint(cp)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
