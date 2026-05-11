import { useMemo, useState } from 'react'
import EditTransactionModal from '../../components/admin/EditTransactionModal'
import AdminPagination from '../../components/admin/AdminPagination'
import AdminTableSkeletonBody from '../../components/admin/AdminTableSkeletonBody'
import fidelityLogo from '../../assets/Fidelity_Bank_Plc_Main_Logo.svg'
import { useAdminData } from '../../context/AdminDataContext'
import {
  channelLabel,
  channelPillClass,
} from '../../lib/channelStyles'
import { vehicleTypeToApiPayload } from '../../lib/normalizeTransaction'
import { vehicleLabel, vehiclePillClass } from '../../lib/vehicleStyles'
import { describeTransactionPatchForLog } from '../../lib/describeTransactionPatchForLog'
import { formatDateShort, formatMoney } from '../../lib/formatters'
import { statusPillClass } from '../../lib/statusStyles'
import type { Transaction, TransactionStatus } from '../../types/transaction'
import {
  settlementTransactionsQueryKey,
  SETTLEMENT_PAGE_SIZE,
  useSettlementTransactionsQuery,
} from '../../query/settlement'
import { dashboardOverviewQueryKey } from '../../query/dashboardOverview'
import { queryClient } from '../../query/queryClient'
import { TransactionsApi } from '../../utils'

const STATUS_EMPHASIS: TransactionStatus[] = ['completed', 'pending', 'failed']

export default function SettlementPage() {
  const { appendLog } = useAdminData()
  const [pageIndex, setPageIndex] = useState(0)
  const [modalTx, setModalTx] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const settlementQuery = useSettlementTransactionsQuery(pageIndex)
  const payload = settlementQuery.data
  const rows = payload?.data ?? []
  const totalItems = payload?.total ?? 0
  const apiTotalPages = payload?.total_pages ?? 0

  const uiPage = pageIndex + 1
  const totalPagesForUi =
    totalItems > 0 ? Math.max(1, apiTotalPages) : 0

  const statusStats = useMemo(() => {
    const m = new Map<TransactionStatus, { count: number; volume: number }>()
    for (const s of STATUS_EMPHASIS) m.set(s, { count: 0, volume: 0 })
    for (const t of rows) {
      const cur = m.get(t.status) ?? { count: 0, volume: 0 }
      cur.count += 1
      cur.volume += t.amount
      m.set(t.status, cur)
    }
    return m
  }, [rows])

  const handleSave = async (id: string, patch: Partial<Transaction>) => {
    const prev = rows.find((t) => t.id === id)
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
      const ticket = prev.reference?.trim() || id
      appendLog({
        action: 'reconciliation',
        summary: `Updated ${ticket}`,
        detail: `Settlement · ticket ${ticket}. ${describeTransactionPatchForLog(prev, patch, updated)}`,
      })
      void queryClient.invalidateQueries({
        queryKey: settlementTransactionsQueryKey,
      })
      void queryClient.invalidateQueries({
        queryKey: dashboardOverviewQueryKey,
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
      setModalOpen(false)
      setModalTx(null)
    } catch {
      appendLog({
        action: 'settings',
        summary: `Save failed for ${prev.reference ?? id}`,
        detail: 'Could not update transaction on the server.',
      })
    }
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-linear-to-br from-sky-50/90 via-white to-white p-6 shadow-[0_12px_48px_-28px_rgba(14,165,233,0.15)] ring-1 ring-sky-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-sky-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-900/80">
              Fidelity pay rail
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
              Settlement
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
              Rows cleared through <strong>Fidelity Bank Plc</strong> as pay provider.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-inner ring-1 ring-sky-200/80">
            <img
              src={fidelityLogo}
              alt="Fidelity Bank Plc"
              className="h-full w-full object-contain object-center"
            />
          </div>
        </div>
      </header>

      <section aria-label="Settlement status breakdown">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          Status mix (this page)
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {STATUS_EMPHASIS.map((status) => {
            const row = statusStats.get(status) ?? { count: 0, volume: 0 }
            const label =
              status === 'completed'
                ? 'Completed'
                : status === 'pending'
                  ? 'Pending'
                  : 'Failed'
            const tint =
              status === 'completed'
                ? 'border-emerald-200/90 bg-emerald-50/50 ring-emerald-100'
                : status === 'pending'
                  ? 'border-amber-200/90 bg-amber-50/50 ring-amber-100'
                  : 'border-rose-200/90 bg-rose-50/50 ring-rose-100'
            return (
              <div
                key={status}
                className={`rounded-2xl border px-4 py-3 ring-1 ${tint}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-950">
                  {formatMoney(row.volume)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">{row.count} payments</p>
              </div>
            )
          })}
        </div>
      </section>

      <section
        className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_8px_40px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5"
        aria-label="Fidelity settlement transactions"
      >
        <div className="border-b border-zinc-100 bg-linear-to-r from-white to-zinc-50/90 px-5 py-4">
          <p className="text-sm font-medium text-zinc-700">
            <span className="tabular-nums font-bold text-zinc-950">{totalItems}</span>{' '}
            settlement row{totalItems === 1 ? '' : 's'} · newest first ·{' '}
            {SETTLEMENT_PAGE_SIZE} per page
          </p>
        </div>

        {settlementQuery.isError ? (
          <p className="px-5 py-10 text-center text-sm text-rose-700">
            {settlementQuery.error instanceof Error
              ? settlementQuery.error.message
              : 'Could not load settlement data.'}
          </p>
        ) : null}

        <div
          className="overflow-x-auto"
          aria-busy={settlementQuery.isPending}
        >
          <table
            className="w-full min-w-[880px] border-collapse text-left text-sm"
            aria-label={
              settlementQuery.isPending
                ? 'Loading settlement'
                : 'Settlement transactions'
            }
          >
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="whitespace-nowrap px-5 py-3.5">Ticket ID</th>
                <th className="whitespace-nowrap px-5 py-3.5">Customer</th>
                <th className="whitespace-nowrap px-5 py-3.5">Vehicle</th>
                <th className="whitespace-nowrap px-5 py-3.5">Payment type</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Amount</th>
                <th className="whitespace-nowrap px-5 py-3.5">Status</th>
                <th className="whitespace-nowrap px-5 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {settlementQuery.isPending ? (
                <AdminTableSkeletonBody
                  rows={SETTLEMENT_PAGE_SIZE}
                  columns={7}
                  rightAlignIndices={[4]}
                />
              ) : (
                rows.map((t) => (
                    <tr
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer transition hover:bg-sky-50/40"
                      onClick={() => {
                        setModalTx(t)
                        setModalOpen(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setModalTx(t)
                          setModalOpen(true)
                        }
                      }}
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-zinc-900">
                        {t.reference}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-zinc-800">
                        {t.customerName}
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
                          className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusPillClass[t.status]}`}
                        >
                          {t.status}
                        </span>
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

        {!settlementQuery.isPending && totalItems === 0 && !settlementQuery.isError ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">
            No settlement rows returned from the server.
          </p>
        ) : null}

        <div className="border-t border-zinc-100 px-5 pb-5 pt-2">
          <AdminPagination
            page={uiPage}
            totalPages={totalPagesForUi}
            totalItems={totalItems}
            pageSize={SETTLEMENT_PAGE_SIZE}
            onPageChange={(p) => setPageIndex(p - 1)}
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
    </div>
  )
}
