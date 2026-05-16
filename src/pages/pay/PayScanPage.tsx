import { Html5Qrcode } from 'html5-qrcode'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import ScanViewfinderFrame from './ScanViewfinderFrame'
import {
  isDesktopViewport,
  parseScannedTicketId,
  PAY_TICKET_ID_PARAM,
  SCAN_CAPTURE_LOADING_MS,
  SCAN_VIEWFINDER_RATIO,
} from './payFlowShared'

export default function PayScanPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const scannerWrapRef = useRef<HTMLDivElement | null>(null)
  const viewfinderRef = useRef<HTMLDivElement | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const captureBusyRef = useRef(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [capturedId, setCapturedId] = useState<string | null>(null)
  const [captureLoading, setCaptureLoading] = useState(false)

  const onTicketCaptured = useCallback(
    (rawId: string) => {
      const id = parseScannedTicketId(rawId)
      if (!id || captureBusyRef.current) return
      captureBusyRef.current = true
      setScannerError(null)
      setCapturedId(id)
      setCaptureLoading(true)
      setSearchParams({ [PAY_TICKET_ID_PARAM]: id }, { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (!capturedId || !captureLoading) return

    const timer = window.setTimeout(() => {
      navigate(
        `/pay/checkout?${PAY_TICKET_ID_PARAM}=${encodeURIComponent(capturedId)}`,
      )
    }, SCAN_CAPTURE_LOADING_MS)

    return () => window.clearTimeout(timer)
  }, [capturedId, captureLoading, navigate])

  useEffect(() => {
    if (isDesktopViewport()) return
    if (capturedId) return

    let cancelled = false
    const start = async () => {
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      )
      if (cancelled) return
      const el = scannerWrapRef.current
      if (!el) return

      setScannerError(null)
      const regionId = 'pay-ticket-scanner-host'
      el.id = regionId

      const prev = scannerRef.current
      if (prev) {
        void prev.stop().catch(() => {})
        prev.clear()
        scannerRef.current = null
      }

      const html5 = new Html5Qrcode(regionId, false)
      scannerRef.current = html5

      const qrbox = (viewfinderW: number, viewfinderH: number) => {
        const frame = viewfinderRef.current
        if (frame) {
          const { width, height } = frame.getBoundingClientRect()
          if (width > 0 && height > 0) {
            return {
              width: Math.floor(width),
              height: Math.floor(height),
            }
          }
        }
        const side = Math.floor(
          Math.min(viewfinderW, viewfinderH) * SCAN_VIEWFINDER_RATIO,
        )
        return { width: side, height: side }
      }

      const onScanSuccess = (decoded: string) => {
        const id = parseScannedTicketId(decoded ?? '')
        if (!id || captureBusyRef.current) return
        void html5.pause(true)
        onTicketCaptured(id)
      }

      const tryStart = async (constraints: { facingMode: string }) =>
        html5.start(
          constraints,
          { fps: 12, qrbox, aspectRatio: 1.0 },
          onScanSuccess,
          () => {},
        )

      try {
        await tryStart({ facingMode: 'environment' })
      } catch {
        try {
          await tryStart({ facingMode: 'user' })
        } catch (e) {
          scannerRef.current = null
          const msg =
            e instanceof Error ? e.message : 'Could not start the camera.'
          setScannerError(
            /Permission|permission|denied|NotAllowed/i.test(msg)
              ? 'Camera access was blocked. Allow the camera for this site, or enter your ticket ID on the Ticket page.'
              : `${msg} You can enter your ticket ID on the Ticket page instead.`,
          )
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      const s = scannerRef.current
      scannerRef.current = null
      if (s) {
        void s.stop().catch(() => {})
        s.clear()
      }
    }
  }, [capturedId, onTicketCaptured])

  if (isDesktopViewport()) {
    return <Navigate to="/pay/ticket" replace />
  }

  const urlTicketId = searchParams.get(PAY_TICKET_ID_PARAM)?.trim()
  const displayCapturedId = capturedId ?? urlTicketId
  const isCapturePhase = Boolean(displayCapturedId && captureLoading)

  return (
    <div className="absolute inset-0 bg-black">
      <div className="pay-scanner-host relative z-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-zinc-950">
        <div ref={scannerWrapRef} className="absolute inset-0" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div ref={viewfinderRef}>
          <ScanViewfinderFrame
            capturedValue={displayCapturedId}
            loading={isCapturePhase}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/80 via-black/30 to-transparent px-4 pb-24 pt-14">
        <p className="text-center text-sm font-medium leading-snug text-white drop-shadow-md">
          {isCapturePhase
            ? 'Loading ticket…'
            : 'Point at the ticket QR code to scan.'}
        </p>
        {scannerError ? (
          <p
            className="mx-auto mt-3 max-w-sm rounded-lg bg-amber-400/95 px-3 py-2 text-center text-sm font-medium text-amber-950"
            role="status"
          >
            {scannerError}
          </p>
        ) : null}
        {!isCapturePhase ? (
          <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-400 drop-shadow-md">
            Prefer typing? Open the{' '}
            <span className="font-semibold text-white">Ticket</span> page below.
          </p>
        ) : null}
      </div>
    </div>
  )
}
