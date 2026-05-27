import { useEffect, useMemo, useState } from 'react'
import AdminPagination from '../../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../../components/admin/AdminTableSkeletonBody'
import TableSearchInput from '../../../components/admin/TableSearchInput'
import TableToolbar from '../../../components/admin/TableToolbar'
import TransactionDateFilterDropdown from '../../../components/admin/TransactionDateFilterDropdown'
import { channelLabel, channelPillClass } from '../../../lib/channelStyles'
import { formatDateTime, formatMoney } from '../../../lib/formatters'
import { statusPillClass } from '../../../lib/statusStyles'
import { vehicleLabel, vehiclePillClass } from '../../../lib/vehicleStyles'
import {
  labelForTransactionDateFilter,
  parseFilterValue,
  dateSelectionToApiRange,
  type DateFilterSelection,
} from '../../../lib/transactionDateFilter'
import type { LossTicketRow } from '../../../types/reconciliation'
import {
  LOSS_TICKET_PAGE_SIZE,
  useLossTicketsQuery,
} from '../../../query/reconciliation'

export default function LossTicketTab() {
  const [query, setQuery] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [filterValue, setFilterValue] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateSelection: DateFilterSelection = useMemo(() => {
    const parsed = parseFilterValue(filterValue, customStart, customEnd)
    if (parsed.kind === 'custom' && (!customStart.trim() || !customEnd.trim())) {
      return { kind: 'all' }
    }
    return parsed
  }, [filterValue, customStart, customEnd])

  const apiRange = useMemo(
    () => dateSelectionToApiRange(dateSelection),
    [dateSelection],
  )

  const customIncomplete =
    filterValue === 'custom' &&
    (!customStart.trim() || !customEnd.trim())

  const listQuery = useLossTicketsQuery(
    pageIndex,
    query,
    apiRange,
    !customIncomplete,
  )

  const rows: LossTicketRow[] = listQuery.data?.data ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = total > 0 ? Math.max(1, listQuery.data?.total_pages ?? 0) : 0
  const from = total > 0 ? pageIndex * LOSS_TICKET_PAGE_SIZE + 1 : 0
  const to = Math.min((pageIndex + 1) * LOSS_TICKET_PAGE_SIZE, total)

  useEffect(() => {
    setPageIndex(0)
  }, [query, dateSelection])

  const filterSummary = useMemo(
    () => labelForTransactionDateFilter(filterValue, customStart, customEnd),
    [filterValue, customStart, customEnd],
  )

  return (
    <div className="min-w-0">
      <TableToolbar
        right={
          <>
            <span className="tabular-nums">
              {listQuery.isPending ? (
                <span
                  className="inline-block h-4 w-28 animate-pulse rounded-md bg-zinc-200/80"
                  aria-hidden
                />
              ) : listQuery.isError ? (
                <span className="text-rose-700">Could not load</span>
              ) : (
                <>
                  <span className="font-bold text-zinc-900">{total}</span> row
                  {total === 1 ? '' : 's'}
                  {total > 0 && (
                    <>
                      {' '}
                      · <span className="tabular-nums">{from}–{to}</span>
                    </>
                  )}
                </>
              )}
            </span>
            <TransactionDateFilterDropdown
              filterValue={filterValue}
              onFilterChange={setFilterValue}
              triggerLabel={filterSummary}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
          </>
        }
      >
        <TableSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search ticket ID, notes…"
          ariaLabel="Search loss tickets"
        />
      </TableToolbar>

      {customIncomplete ? (
        <p className="border-b border-amber-100 bg-amber-50/60 px-5 py-3 text-sm text-amber-800">
          Set a custom date &amp; time range using <strong>Date range</strong> above.
        </p>
      ) : null}

      <div className="overflow-x-auto" aria-busy={listQuery.isPending}>
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="whitespace-nowrap px-5 py-3.5">Ticket ID</th>
              <th className="whitespace-nowrap px-5 py-3.5">Vehicle</th>
              <th className="whitespace-nowrap px-5 py-3.5">Payment type</th>
              <th className="whitespace-nowrap px-5 py-3.5 text-right">Amount</th>
              <th className="whitespace-nowrap px-5 py-3.5">Status</th>
              <th className="whitespace-nowrap px-5 py-3.5">Loss reason</th>
              <th className="whitespace-nowrap px-5 py-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {listQuery.isPending ? (
              <AdminTableSkeletonBody
                rows={LOSS_TICKET_PAGE_SIZE}
                columns={7}
                rightAlignIndices={[3]}
              />
            ) : listQuery.isError ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-rose-700">
                  Could not load loss tickets.{' '}
                  {listQuery.error instanceof Error
                    ? listQuery.error.message
                    : 'Try again later.'}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-zinc-500">
                  No data found
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id} className="hover:bg-orange-50/40">
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
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ring-inset ${statusPillClass[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 text-zinc-600">
                    {(t.lossReason ?? t.notes) || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-zinc-600">
                    {formatDateTime(t.createdAt)}
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
          totalItems={total}
          pageSize={LOSS_TICKET_PAGE_SIZE}
          onPageChange={(p) => setPageIndex(p - 1)}
        />
      </div>
    </div>
  )
}
