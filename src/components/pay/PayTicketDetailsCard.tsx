import type { ReactNode } from 'react'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import type { PayTicketDetails } from '../../types/ticketPay'
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

type PayTicketDetailsCardProps = {
  ticket: PayTicketDetails
  children?: ReactNode
}

export default function PayTicketDetailsCard({
  ticket,
  children,
}: PayTicketDetailsCardProps) {
  return (
    <PayReceiptRoot className="border-x-0 sm:border-x">
      <PayReceiptBrandHeader
        title="Parking ticket"
        subtitle="Review before payment"
        meta={ticket.ticketId}
      />
      <PayReceiptStatus tone="neutral">Ticket located · ready to pay</PayReceiptStatus>

      <PayReceiptBody>
        <PayReceiptSection>
          <PayReceiptRow label="Vehicle" value={ticket.vehicleClass} />
          <PayReceiptRow label="Zone" value={ticket.entryZone} />
          <PayReceiptRow label="Entry" value={formatDateTime(ticket.entryTime)} />
          <PayReceiptRow label="Duration" value={ticket.durationParked} emphasize />
        </PayReceiptSection>

        <PayReceiptDivider />

        <PayReceiptTotal
          label="Amount due"
          amount={formatMoney(ticket.amountDue, ticket.currency)}
        />
      </PayReceiptBody>

      <PayReceiptFootnote>
        Seymour Aviation Ltd. · Parking services
      </PayReceiptFootnote>

      {children ? <PayReceiptActions>{children}</PayReceiptActions> : null}
    </PayReceiptRoot>
  )
}
