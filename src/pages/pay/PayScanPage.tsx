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
  parseScannedTicketId,
  PAY_TICKET_ID_PARAM,
  PAY_STEP_PARAM,
  PAY_STEP_CHECKOUT,
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

  useEffect(() => {
    if (!ticketIdParam) scanLockRef.current = false
  }, [ticketIdParam])

  const clearTicket = useCallback(() => {
    scanLockRef.current = false
    setScannerError(null)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const showDetailsOnly = useCallback(() => {
    setSearchParams({ [PAY_TICKET_ID_PARAM]: ticketIdParam }, { replace: true })
  }, [setSearchParams, ticketIdParam])

  const startPayment = useCallback(() => {
    setSearchParams(
      { [PAY_TICKET_ID_PARAM]: ticketIdParam, [PAY_STEP_PARAM]: PAY_STEP_CHECKOUT },
      { replace: true },
    )
  }, [setSearchParams, ticketIdParam])

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
        onBackToDetails={showDetailsOnly}
      />
    )
  }

  if (ticketIdParam) {
    return (
      <PayTicketDetailsStep
        ticketId={ticketIdParam}
        onBack={clearTicket}
        onContinueToPay={startPayment}
        backLabel="Scan another ticket"
      />
    )
  }

  return (
    <div className="relative h-screen  w-full bg-black">
      <PayScannerCamera
        ref={cameraRef}
        active={!scannerError}
        onDecoded={onQrDecoded}
        onError={onScannerError}
      />

      <div
        className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center "
        aria-hidden
      >
        <ScanViewfinderFrame showScanLine={!scannerError} />
      </div>

      {scannerError ? <ScanCameraErrorBanner message={scannerError} /> : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-linear-to-t from-black/80 via-black/30 to-transparent px-4 pb-24 pt-10">
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
