import type { ReactNode } from 'react'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import type { PayTicketDetails } from '../../types/ticketPay'
import PayExpandableQrCode from './PayExpandableQrCode'

type PayTicketDetailsCardProps = {
  ticket: PayTicketDetails
  children?: ReactNode
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className="shrink-0 text-sm text-zinc-500">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-zinc-900">{value}</span>
    </div>
  )
}

export default function PayTicketDetailsCard({
  ticket,
  children,
}: PayTicketDetailsCardProps) {
  const isExtra = ticket.chargeType === 'extra'

  return (
    <article className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white sm:rounded-2xl">
      <div className="flex items-start gap-4 border-b border-zinc-100 px-5 pt-6 pb-5 sm:gap-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900">
            {isExtra ? 'Extra parking' : 'Parking ticket'}
          </p>
          <p className="mt-1 break-all font-mono text-lg font-semibold leading-snug tracking-tight text-zinc-950">
            {ticket.ticketId}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {isExtra ? 'Overstay charges after exit window' : 'Ready to pay'}
          </p>
        </div>

        <PayExpandableQrCode
          value={ticket.ticketId}
          ariaLabel={`QR code for ticket ${ticket.ticketId}`}
          title={isExtra ? 'Extra parking QR code' : 'Parking ticket QR code'}
          caption={isExtra ? 'Show this code when paying overstay charges' : 'Show this code at the gate or exit'}
        />
      </div>

      <div className="px-5 py-1 sm:px-6">
        <Row label="Vehicle class" value={ticket.vehicleClass} />
        {!isExtra ? <Row label="Entry" value={formatDateTime(ticket.entryTime)} /> : null}
        <Row label={isExtra ? 'Overstay' : 'Duration'} value={ticket.durationParked} />
        {isExtra && ticket.extraHourRate != null ? (
          <Row
            label="Rate"
            value={`${formatMoney(ticket.extraHourRate, ticket.currency)}/hr`}
          />
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-6 border-t border-zinc-200 px-5 py-4 sm:px-6">
        <span className="text-sm font-medium text-zinc-900">
          {isExtra ? 'Extra due' : 'Amount due'}
        </span>
        <span className="text-xl font-semibold tabular-nums text-zinc-950">
          {formatMoney(ticket.amountDue, ticket.currency)}
        </span>
      </div>

      {children ? (
        <div className="flex flex-col gap-2 border-t border-zinc-100 px-5 py-5 sm:px-6">
          {children}
        </div>
      ) : null}
    </article>
  )
}
