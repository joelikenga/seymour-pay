import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import PayExpandableQrCode from '../../components/pay/PayExpandableQrCode'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import {
  clearPayTransactions,
  loadPayTransactions,
  type PayTransactionRecord,
} from '../../lib/payTransactionHistory'
import { PAY_PAGE_INNER, PAY_PAGE_MAIN, PAY_MOBILE_TOP_BAR_OFFSET, PAY_MOBILE_NAV_CLEARANCE } from './payFlowShared'
import { payBtnGhost } from './payUi'

function methodLabel(method: string): string {
  return method === 'transfer' ? 'Bank transfer' : 'Card'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className="shrink-0 text-sm text-zinc-500">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-zinc-900">{value}</span>
    </div>
  )
}

function PayHistoryItem({ item }: { item: PayTransactionRecord }) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white sm:rounded-2xl">
      <div className="flex items-start gap-4 border-b border-zinc-100 px-5 py-5 sm:gap-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-500">Amount paid</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">
            {formatMoney(item.amount, item.currency)}
          </p>
        </div>

        <PayExpandableQrCode
          value={item.ticketId}
          size={72}
          ariaLabel={`QR code for ticket ${item.ticketId}`}
          title="Payment QR code"
          caption="Ticket ID for this payment"
          showEnlargeHint={false}
        />
      </div>

      <div className="px-5 py-1 sm:px-6">
        <Row label="Method" value={methodLabel(item.payMethod)} />
        <Row label="Duration" value={item.duration?.trim() || 'N/A'} />
        <Row label="Date" value={formatDateTime(item.paidAt)} />
      </div>
    </article>
  )
}

export default function PayHistoryPage() {
  const { pathname } = useLocation()
  const [historyItems, setHistoryItems] = useState<PayTransactionRecord[]>(
    () => loadPayTransactions(),
  )

  useEffect(() => {
    setHistoryItems(loadPayTransactions())
  }, [pathname])

  const handleClearAll = useCallback(() => {
    clearPayTransactions()
    setHistoryItems([])
  }, [])

  return (
    <div className={`${PAY_PAGE_MAIN} ${PAY_MOBILE_TOP_BAR_OFFSET} ${PAY_MOBILE_NAV_CLEARANCE}`}>
      <div className={`${PAY_PAGE_INNER} lg:max-w-2xl`}>
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 lg:text-xl">
              Payment history
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Last 10 payments on this device
            </p>
          </div>
          {historyItems.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className={`shrink-0 self-start text-xs sm:self-auto ${payBtnGhost}`}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {historyItems.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:rounded-2xl">
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-zinc-800">No payments yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Completed ticket payments will appear here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {historyItems.map((h) => (
              <li key={h.id}>
                <PayHistoryItem item={h} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
