import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import {
  createPayScanner,
  PAY_SCANNER_REGION_ID,
  startPayScanner,
  stopPayScanner,
  waitForScannerHostLayout,
  type PayScannerCameraDevice,
} from '../../lib/payScanner'

export type PayScannerCameraHandle = {
  stop: () => Promise<void>
}

type PayScannerCameraProps = {
  active: boolean
  /** Explicit camera device id; omit to use the default main rear lens. */
  deviceId?: string
  onDecoded: (raw: string) => void
  onError: (message: string) => void
  onCamerasReady?: (cameras: PayScannerCameraDevice[]) => void
}

/** Camera mount isolated so React re-renders do not wipe html5-qrcode DOM. */
const PayScannerCamera = forwardRef<PayScannerCameraHandle, PayScannerCameraProps>(
  function PayScannerCamera(
    { active, deviceId, onDecoded, onError, onCamerasReady },
    ref,
  ) {
    const mountRef = useRef<HTMLDivElement>(null)
    const scannerRef = useRef<ReturnType<typeof createPayScanner> | null>(null)
    const sessionRef = useRef(0)
    const onDecodedRef = useRef(onDecoded)
    const onErrorRef = useRef(onError)
    const onCamerasReadyRef = useRef(onCamerasReady)

    onDecodedRef.current = onDecoded
    onErrorRef.current = onError
    onCamerasReadyRef.current = onCamerasReady

    useImperativeHandle(ref, () => ({
      stop: () => stopPayScanner(scannerRef.current),
    }))

    useEffect(() => {
      if (!active) {
        void stopPayScanner(scannerRef.current)
        scannerRef.current = null
        return
      }

      const session = ++sessionRef.current
      let cancelled = false

      const start = async () => {
        await stopPayScanner(scannerRef.current)
        scannerRef.current = null

        if (cancelled || session !== sessionRef.current) return

        await new Promise<void>((r) => setTimeout(r, 100))

        const mount = mountRef.current
        if (!mount || cancelled || session !== sessionRef.current) return

        mount.id = PAY_SCANNER_REGION_ID

        const hasLayout = await waitForScannerHostLayout(mount)
        if (!hasLayout || cancelled || session !== sessionRef.current) {
          onErrorRef.current(
            'Camera preview could not be sized. Try reopening Scan.',
          )
          return
        }

        const html5 = createPayScanner()
        scannerRef.current = html5

        try {
          const cameras = await startPayScanner(
            html5,
            (decoded) => {
              if (cancelled || session !== sessionRef.current) return
              onDecodedRef.current(decoded)
            },
            { deviceId },
          )
          if (!cancelled && session === sessionRef.current) {
            onCamerasReadyRef.current?.(cameras)
          }
        } catch (e) {
          if (cancelled || session !== sessionRef.current) return
          scannerRef.current = null
          await stopPayScanner(html5)
          const msg =
            e instanceof Error ? e.message : 'Could not start the camera.'
          onErrorRef.current(
            /Permission|permission|denied|NotAllowed/i.test(msg)
              ? 'Camera access was blocked. Allow the camera for this site, or enter your ticket ID on the Ticket page.'
              : 'Could not start the camera. You can enter your ticket ID on the Ticket page instead.',
          )
        }
      }

      void start()

      return () => {
        cancelled = true
        const s = scannerRef.current
        scannerRef.current = null
        void stopPayScanner(s)
      }
    }, [active, deviceId])

    return (
      <div
        ref={mountRef}
        className="pay-scanner-host absolute inset-0 z-0 h-full w-full overflow-hidden bg-black"
        aria-hidden={!active}
      />
    )
  },
)

export default PayScannerCamera
