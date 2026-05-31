import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import PayPaymentFlow from './PayPaymentFlow'
import {
  decodePayTicketParam,
  isPayExtraPath,
  payTicketPreviewUrl,
  resolveLegacyPayQueryRedirect,
} from './payFlowShared'

export default function PayPaymentPage() {
  const { ticketId: ticketIdParam } = useParams<{ ticketId: string }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const legacyRedirect = resolveLegacyPayQueryRedirect(searchParams)

  if (legacyRedirect) {
    return <Navigate to={legacyRedirect} replace />
  }

  const ticketId = decodePayTicketParam(ticketIdParam)
  const extraPay = isPayExtraPath(pathname)

  if (!ticketId) {
    return <Navigate to="/pay/ticket" replace />
  }

  return (
    <PayPaymentFlow
      ticketId={ticketId}
      extraPay={extraPay}
      onBackToDetails={() => navigate(payTicketPreviewUrl(ticketId, extraPay))}
    />
  )
}
