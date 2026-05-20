import type { ReactNode } from 'react'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import { computePayExtraCharges } from '../../lib/payExtraCharges'
import type { PayMethod, PayTicketDetails } from '../../types/ticketPay'
import { payBtnPrimary, payBtnSecondary } from '../../pages/pay/payUi'
import PayExpandableQrCode from './PayExpandableQrCode'

function methodLabel(method: PayMethod): string {
  return method === 'transfer' ? 'Bank transfer' : 'Card'
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className="shrink-0 text-sm text-zinc-500">{label}</span>
      <span
        className={`min-w-0 text-right text-sm font-medium text-zinc-900 ${mono ? 'font-mono text-[13px]' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

type PayPaymentReceiptProps = {
  ticket: PayTicketDetails
  paymentRef: string
  paidAt: string
  payMethod: PayMethod
  exitExpired: boolean
  actions?: ReactNode
  onViewExitTimer?: () => void
  onPayExtra?: () => void
}

export default function PayPaymentReceipt({
  ticket,
  paymentRef,
  paidAt,
  payMethod,
  exitExpired,
  actions,
  onViewExitTimer,
  onPayExtra,
}: PayPaymentReceiptProps) {
  const extraQuote = exitExpired ? computePayExtraCharges(ticket.vehicleClass) : null

  return (
    <article className="relative mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white sm:rounded-2xl">
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-20 w-20 overflow-hidden sm:h-24 sm:w-24"
        aria-hidden
      >
        <span
          className={`absolute left-[-18px] top-[22px] w-[140px] rotate-45 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-md sm:left-[-14px] sm:top-[26px] sm:py-2 sm:text-xs ${
            exitExpired ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {exitExpired ? 'Expired' : 'Paid'}
        </span>
      </div>

      <div className="border-b border-zinc-100 px-5 py-5 pr-14 sm:px-6 sm:pr-16">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">Payment receipt</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
            {exitExpired ? 'Exit window ended' : 'Payment confirmed'}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{formatDateTime(paidAt)}</p>
          <p className="mt-1 break-all font-mono text-xs text-zinc-400">{paymentRef}</p>
        </div>
      </div>

      <div className="flex items-start gap-4 border-b border-zinc-100 px-5 py-5 sm:gap-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900">Exit pass</p>
          <p className="mt-1 break-all font-mono text-lg font-semibold leading-snug tracking-tight text-zinc-950">
            {ticket.ticketId}
          </p>
          <p className="mt-2 text-xs text-zinc-500">Present this code at exit</p>
        </div>

        <PayExpandableQrCode
          value={ticket.ticketId}
          ariaLabel={`Exit QR code for ticket ${ticket.ticketId}`}
          title="Exit pass QR code"
          caption="Present this code at the exit gate"
        />
      </div>

      <div className="px-5 py-1 sm:px-6">
        <Row label="Vehicle" value={ticket.vehicleClass} />
        <Row label="Zone" value={ticket.entryZone} />
        <Row label="Method" value={methodLabel(payMethod)} />
      </div>

      <div className="flex items-baseline justify-between gap-6 border-t border-zinc-200 px-5 py-4 sm:px-6">
        <span className="text-sm font-medium text-zinc-900">Total paid</span>
        <span className="text-xl font-semibold tabular-nums text-zinc-950">
          {formatMoney(ticket.amountDue, ticket.currency)}
        </span>
      </div>

      {exitExpired && extraQuote ? (
        <div className="border-t border-rose-100 bg-rose-50/40 px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-rose-900">Extra parking charges</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-800/80">
            Your exit window has ended. Additional time is billed at the hourly rate below.
          </p>
          <div className="mt-3 space-y-0">
            <Row label="Overstay" value={`${extraQuote.extraHours} hours`} />
            <Row
              label="Rate"
              value={`${formatMoney(extraQuote.extraHourRate, ticket.currency)}/hr`}
            />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-6 border-t border-rose-100/80 pt-3">
            <span className="text-sm font-medium text-rose-900">Extra due</span>
            <span className="text-xl font-semibold tabular-nums text-rose-950">
              {formatMoney(extraQuote.amountDue, ticket.currency)}
            </span>
          </div>
          {onPayExtra ? (
            <button type="button" onClick={onPayExtra} className={`mt-4 ${payBtnPrimary}`}>
              Pay extra charges
            </button>
          ) : null}
        </div>
      ) : null}

      {!exitExpired && onViewExitTimer ? (
        <div className="border-t border-zinc-100 px-5 py-4 sm:px-6">
          <button type="button" onClick={onViewExitTimer} className={payBtnSecondary}>
            View exit timer
          </button>
        </div>
      ) : null}

      {actions && !exitExpired ? (
        <div className="flex flex-col gap-2 border-t border-zinc-100 px-5 py-5 sm:px-6">
          {actions}
        </div>
      ) : null}
    </article>
  )
}
