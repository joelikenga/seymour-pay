import { Navigate, useSearchParams } from 'react-router-dom'
import {
  payTicketPaymentUrl,
  PAY_TICKET_ID_PARAM,
  resolveLegacyPayQueryRedirect,
} from './payFlowShared'

/** Legacy `/pay/checkout?ticketID=…` redirects to `/pay/ticket/:id/payment`. */
export default function PayCheckoutPage() {
  const [searchParams] = useSearchParams()
  const legacyRedirect = resolveLegacyPayQueryRedirect(searchParams)
  if (legacyRedirect) {
    return <Navigate to={legacyRedirect} replace />
  }

  const ticketId = searchParams.get(PAY_TICKET_ID_PARAM)?.trim()
  if (ticketId) {
    return <Navigate to={payTicketPaymentUrl(ticketId)} replace />
  }

  return <Navigate to="/pay" replace />
}
