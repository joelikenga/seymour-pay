import { Navigate, useSearchParams } from 'react-router-dom'
import { payTicketCheckoutUrl, PAY_TICKET_ID_PARAM } from './payFlowShared'

/** Legacy `/pay/checkout` URLs redirect to `/pay?ticketID=…` (and `&pay=1` when paying). */
export default function PayCheckoutPage() {
  const [searchParams] = useSearchParams()
  const ticketId = searchParams.get(PAY_TICKET_ID_PARAM)?.trim()

  if (ticketId) {
    return <Navigate to={payTicketCheckoutUrl(ticketId)} replace />
  }

  return <Navigate to="/pay" replace />
}
