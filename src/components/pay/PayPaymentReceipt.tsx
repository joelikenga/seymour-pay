import type { ReactNode } from 'react'
import QRCode from 'react-qr-code'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import type { PayMethod, PayTicketDetails } from '../../types/ticketPay'
import {
  PayReceiptActions,
  PayReceiptBody,
  PayReceiptBrandHeader,
  PayReceiptDivider,
  PayReceiptFootnote,
  PayReceiptRoot,
  PayReceiptRow,
  PayReceiptSection,
  PayReceiptStatus,
  PayReceiptTotal,
} from './PayReceipt'

function methodLabel(method: PayMethod): string {
  return method === 'transfer' ? 'Bank transfer' : 'Card'
}

type PayPaymentReceiptProps = {
  ticket: PayTicketDetails
  paymentRef: string
  paidAt: string
  payMethod: PayMethod
  exitExpired: boolean
  actions?: ReactNode
  onViewExitTimer?: () => void
}

export default function PayPaymentReceipt({
  ticket,
  paymentRef,
  paidAt,
  payMethod,
  exitExpired,
  actions,
  onViewExitTimer,
}: PayPaymentReceiptProps) {
  const qrValue = ticket.ticketId

  return (
    <PayReceiptRoot className="border-x-0 sm:border-x">
      <PayReceiptBrandHeader
        title={exitExpired ? 'Exit window ended' : 'Payment receipt'}
        subtitle={
          exitExpired
            ? 'Additional charges may apply'
            : formatDateTime(paidAt)
        }
        meta={paymentRef}
      />
      <PayReceiptStatus tone={exitExpired ? 'error' : 'success'}>
        {exitExpired ? 'Exit period closed' : 'Payment confirmed'}
      </PayReceiptStatus>

      <PayReceiptBody>
        <div className="flex flex-col items-center border-b border-dashed border-zinc-200 pb-5">
          <div className="border border-zinc-200 bg-white p-2">
            <QRCode
              value={qrValue}
              size={120}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 256 256"
            />
          </div>
          <p className="mt-3 max-w-xs text-center text-[11px] leading-relaxed text-zinc-500">
            Present this code at exit.
          </p>
        </div>

        <PayReceiptSection>
          <PayReceiptRow label="Ticket" value={ticket.ticketId} mono />
          <PayReceiptRow label="Vehicle" value={ticket.vehicleClass} />
          <PayReceiptRow label="Zone" value={ticket.entryZone} />
          <PayReceiptRow label="Method" value={methodLabel(payMethod)} />
        </PayReceiptSection>

        <PayReceiptDivider />

        <PayReceiptTotal
          label="Total paid"
          amount={formatMoney(ticket.amountDue, ticket.currency)}
        />

        {!exitExpired && onViewExitTimer ? (
          <button
            type="button"
            onClick={onViewExitTimer}
            className="mt-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            View exit timer
          </button>
        ) : null}

        {exitExpired ? (
          <p className="mt-4 text-[12px] leading-relaxed text-zinc-600">
            The complimentary exit period has ended. Choose a payment method
            again if you still need to pay.
          </p>
        ) : null}
      </PayReceiptBody>

      <PayReceiptFootnote>
        Fidelity Bank Plc · Seymour Aviation Ltd. · Demo receipt
      </PayReceiptFootnote>

      {actions ? <PayReceiptActions>{actions}</PayReceiptActions> : null}
    </PayReceiptRoot>
  )
}
