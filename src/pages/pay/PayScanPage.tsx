import { useCallback, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import PayScannerCamera, {
  type PayScannerCameraHandle,
} from '../../components/pay/PayScannerCamera'
import ScanCameraSwitch from '../../components/pay/ScanCameraSwitch'
import {
  pickDefaultCameraId,
  type PayScannerCameraDevice,
} from '../../lib/payScanner'
import ScanViewfinderFrame from './ScanViewfinderFrame'
import {
  isDesktopViewport,
  parseScannedTicketId,
  payTicketPreviewUrl,
  PAY_SCAN_VIEWFINDER_CLASS,
  resolveLegacyPayQueryRedirect,
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const cameraRef = useRef<PayScannerCameraHandle>(null)
  const scanLockRef = useRef(false)

  const [scannerError, setScannerError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<PayScannerCameraDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  )

  const legacyRedirect = resolveLegacyPayQueryRedirect(searchParams)
  if (legacyRedirect) {
    return <Navigate to={legacyRedirect} replace />
  }

  const onQrDecoded = useCallback(
    async (raw: string) => {
      const ticketId = parseScannedTicketId(raw)
      if (!ticketId || scanLockRef.current) return
      scanLockRef.current = true
      setScannerError(null)
      await cameraRef.current?.stop()
      navigate(payTicketPreviewUrl(ticketId), { replace: true })
    },
    [navigate],
  )

  const onScannerError = useCallback((message: string) => {
    setScannerError(message)
  }, [])

  const onCamerasReady = useCallback((discovered: PayScannerCameraDevice[]) => {
    setCameras(discovered)
  }, [])

  const activeDeviceId =
    selectedDeviceId ?? pickDefaultCameraId(cameras) ?? cameras[0]?.id

  const showCameraPicker = cameras.length > 1 && !scannerError

  if (isDesktopViewport()) {
    return <Navigate to="/pay/ticket" replace />
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
            deviceId={selectedDeviceId}
            onDecoded={onQrDecoded}
            onError={onScannerError}
            onCamerasReady={onCamerasReady}
          />
          <ScanViewfinderFrame showScanLine={!scannerError} />
          {showCameraPicker && activeDeviceId ? (
            <ScanCameraSwitch
              cameras={cameras}
              value={activeDeviceId}
              onChange={setSelectedDeviceId}
            />
          ) : null}
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
