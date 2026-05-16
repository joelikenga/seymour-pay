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
} from '../../lib/payScanner'

export type PayScannerCameraHandle = {
  stop: () => Promise<void>
}

type PayScannerCameraProps = {
  active: boolean
  onDecoded: (raw: string) => void
  onError: (message: string) => void
}

/** Camera mount isolated so React re-renders do not wipe html5-qrcode DOM. */
const PayScannerCamera = forwardRef<PayScannerCameraHandle, PayScannerCameraProps>(
  function PayScannerCamera({ active, onDecoded, onError }, ref) {
    const mountRef = useRef<HTMLDivElement>(null)
    const scannerRef = useRef<ReturnType<typeof createPayScanner> | null>(null)
    const sessionRef = useRef(0)
    const onDecodedRef = useRef(onDecoded)
    const onErrorRef = useRef(onError)

    onDecodedRef.current = onDecoded
    onErrorRef.current = onError

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
          await startPayScanner(html5, (decoded) => {
            if (cancelled || session !== sessionRef.current) return
            onDecodedRef.current(decoded)
          })
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
    }, [active])

    return (
      <div
      // style={{height:"100vh"}}
        ref={mountRef}
        className="pay-scanner-host absolute inset-0 z-0 h-screen  w-full overflow-hidden bg-black"
        aria-hidden={!active}
      />
    )
  },
)

export default PayScannerCamera
