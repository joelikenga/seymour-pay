import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import PayScannerCamera, {
  type PayScannerCameraHandle,
} from '../../components/pay/PayScannerCamera'
import ScanViewfinderFrame from './ScanViewfinderFrame'
import PayPaymentFlow from './PayPaymentFlow'
import PayTicketDetailsStep from './PayTicketDetailsStep'
import {
  isDesktopViewport,
  isPayCheckoutStep,
  isPayExtraStep,
  parseScannedTicketId,
  PAY_EXTRA_PARAM,
  PAY_EXTRA_VALUE,
  PAY_SCAN_VIEWFINDER_CLASS,
  PAY_STEP_PARAM,
  PAY_STEP_CHECKOUT,
  PAY_TICKET_ID_PARAM,
} from './payFlowShared'

function ScanCameraErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="absolute inset-x-0 top-0 z-40 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="alert"
    >
      <div className="mx-auto flex max-w-md gap-3 rounded-xl bg-white px-4 py-3.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] ring-1 ring-zinc-200/80">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <p className="text-left text-sm leading-relaxed font-medium text-zinc-800">
          {message}
        </p>
      </div>
    </div>
  )
}

export default function PayScanPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const cameraRef = useRef<PayScannerCameraHandle>(null)
  const scanLockRef = useRef(false)

  const [scannerError, setScannerError] = useState<string | null>(null)

  const ticketIdParam = searchParams.get(PAY_TICKET_ID_PARAM)?.trim() ?? ''
  const isPaying = isPayCheckoutStep(searchParams)
  const isExtraPay = isPayExtraStep(searchParams)

  const ticketSearchParams = useCallback(
    (checkout?: boolean) => {
      const params: Record<string, string> = {
        [PAY_TICKET_ID_PARAM]: ticketIdParam,
      }
      if (isExtraPay) params[PAY_EXTRA_PARAM] = PAY_EXTRA_VALUE
      if (checkout) params[PAY_STEP_PARAM] = PAY_STEP_CHECKOUT
      return params
    },
    [ticketIdParam, isExtraPay],
  )

  useEffect(() => {
    if (!ticketIdParam) scanLockRef.current = false
  }, [ticketIdParam])

  const clearTicket = useCallback(() => {
    scanLockRef.current = false
    setScannerError(null)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const showDetailsOnly = useCallback(() => {
    setSearchParams(ticketSearchParams(), { replace: true })
  }, [setSearchParams, ticketSearchParams])

  const startPayment = useCallback(() => {
    setSearchParams(ticketSearchParams(true), { replace: true })
  }, [setSearchParams, ticketSearchParams])

  const onQrDecoded = useCallback(
    async (raw: string) => {
      const ticketId = parseScannedTicketId(raw)
      if (!ticketId || scanLockRef.current) return
      scanLockRef.current = true
      setScannerError(null)
      await cameraRef.current?.stop()
      setSearchParams({ [PAY_TICKET_ID_PARAM]: ticketId }, { replace: true })
    },
    [setSearchParams],
  )

  const onScannerError = useCallback((message: string) => {
    setScannerError(message)
  }, [])

  if (isDesktopViewport() && !ticketIdParam) {
    return <Navigate to="/pay/ticket" replace />
  }

  if (ticketIdParam && isPaying) {
    return (
      <PayPaymentFlow
        ticketId={ticketIdParam}
        extraPay={isExtraPay}
        onBackToDetails={showDetailsOnly}
      />
    )
  }

  if (ticketIdParam) {
    return (
      <PayTicketDetailsStep
        ticketId={ticketIdParam}
        extraPay={isExtraPay}
        onBack={clearTicket}
        onContinueToPay={startPayment}
        backLabel={isExtraPay ? 'Back to receipt' : 'Scan another ticket'}
      />
    )
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-black">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <div
          className={`pay-scan-viewfinder-slot relative ${PAY_SCAN_VIEWFINDER_CLASS}`}
        >
          <PayScannerCamera
            ref={cameraRef}
            active={!scannerError}
            onDecoded={onQrDecoded}
            onError={onScannerError}
          />
          <ScanViewfinderFrame showScanLine={!scannerError} />
        </div>
      </div>

      {scannerError ? <ScanCameraErrorBanner message={scannerError} /> : null}

      <div className="pointer-events-none shrink-0 bg-linear-to-t from-black/80 via-black/25 to-transparent px-4 pb-2 pt-6">
        <p className="text-center text-sm font-medium leading-snug text-white drop-shadow-md">
          Point at the ticket QR code to scan.
        </p>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-400">
          Prefer typing? Open the{' '}
          <span className="font-semibold text-white">Ticket</span> tab below.
        </p>
      </div>
    </div>
  )
}
