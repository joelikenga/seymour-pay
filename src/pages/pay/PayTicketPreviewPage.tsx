import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import PayTicketDetailsStep from './PayTicketDetailsStep'
import {
  decodePayTicketParam,
  isDesktopViewport,
  isPayExtraPath,
  payTicketPaymentUrl,
  resolveLegacyPayQueryRedirect,
} from './payFlowShared'

export default function PayTicketPreviewPage() {
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

  const backTarget = isDesktopViewport() ? '/pay/ticket' : '/pay'

  return (
    <PayTicketDetailsStep
      ticketId={ticketId}
      extraPay={extraPay}
      onBack={() => {
        if (extraPay) navigate(-1)
        else navigate(backTarget)
      }}
      onContinueToPay={() => navigate(payTicketPaymentUrl(ticketId, extraPay))}
      backLabel={extraPay ? 'Back to receipt' : 'Scan another ticket'}
    />
  )
}
