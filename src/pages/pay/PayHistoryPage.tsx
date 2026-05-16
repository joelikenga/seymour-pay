import { useMemo, useState } from 'react'
import {
  PayReceiptBody,
  PayReceiptBrandHeader,
  PayReceiptDivider,
  PayReceiptRoot,
  PayReceiptRow,
} from '../../components/pay/PayReceipt'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import {
  clearPayTransactions,
  loadPayTransactions,
} from '../../lib/payTransactionHistory'
import PayMobileLogo from './PayMobileLogo'
import { payBtnGhost } from './payUi'

function methodLabel(method: string): string {
  return method === 'transfer' ? 'Bank transfer' : 'Card'
}

export default function PayHistoryPage() {
  const [historyTick, setHistoryTick] = useState(0)
  const historyItems = useMemo(
    () => loadPayTransactions(),
    [historyTick],
  )

  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain bg-zinc-100 max-lg:pb-20 lg:px-12 lg:pb-12 lg:pt-10">
      <div className="mx-auto w-full max-w-md px-4 pb-8 max-lg:pb-24 lg:max-w-lg lg:px-0">
        <PayMobileLogo />
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
              onClick={() => {
                clearPayTransactions()
                setHistoryTick((t) => t + 1)
              }}
              className={`shrink-0 self-start text-xs sm:self-auto ${payBtnGhost}`}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {historyItems.length === 0 ? (
          <PayReceiptRoot className="mt-8">
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-zinc-800">No payments yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Completed ticket payments will appear here.
              </p>
            </div>
          </PayReceiptRoot>
        ) : (
          <ul className="mt-6 space-y-4">
            {historyItems.map((h) => (
              <li key={h.id}>
                <PayReceiptRoot>
                  <PayReceiptBrandHeader
                    title={formatMoney(h.amount, h.currency)}
                    subtitle={formatDateTime(h.paidAt)}
                    meta={h.ticketId}
                  />
                  <PayReceiptBody>
                    <PayReceiptRow
                      label="Method"
                      value={methodLabel(h.payMethod)}
                    />
                    <PayReceiptDivider />
                    <PayReceiptRow label="Reference" value={h.paymentRef} mono />
                  </PayReceiptBody>
                </PayReceiptRoot>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
