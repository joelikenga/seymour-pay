import QRCode from 'react-qr-code'

const cornerClass = 'absolute h-11 w-11 border-yellow-400'

type ScanViewfinderFrameProps = {
  /** When set, shows captured QR inside the corner frame. */
  capturedValue?: string | null
  /** Yellow spinner over the frame while loading. */
  loading?: boolean
}

export default function ScanViewfinderFrame({
  capturedValue = null,
  loading = false,
}: ScanViewfinderFrameProps) {
  const isCaptured = Boolean(capturedValue)

  return (
    <div
      className="relative aspect-square w-[min(72vw,58vh)] max-w-[300px] overflow-hidden shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]"
      aria-hidden={!loading}
    >
      {!isCaptured ? (
        <div className="pay-scan-viewfinder-track">
          <span className="pay-scan-line" />
        </div>
      ) : null}

      {isCaptured ? (
        <div className="absolute inset-11 z-[5] flex flex-col items-center justify-center">
          <div className="max-w-full rounded-lg bg-white p-2.5 shadow-lg ring-1 ring-yellow-400/40">
            <QRCode
              value={capturedValue!}
              size={168}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 256 256"
            />
          </div>
          <p className="mt-2 max-w-full truncate px-2 text-center font-mono text-[10px] font-medium text-yellow-100/90">
            {capturedValue}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40"
          role="status"
          aria-live="polite"
          aria-label="Loading ticket"
        >
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-yellow-400/25 border-t-yellow-400 shadow-[0_0_28px_rgba(250,204,21,0.4)]" />
        </div>
      ) : null}

      <span
        className={`${cornerClass} left-0 top-0 z-10 rounded-tl-sm border-l-[3.5px] border-t-[3.5px]`}
      />
      <span
        className={`${cornerClass} right-0 top-0 z-10 rounded-tr-sm border-r-[3.5px] border-t-[3.5px]`}
      />
      <span
        className={`${cornerClass} bottom-0 left-0 z-10 rounded-bl-sm border-b-[3.5px] border-l-[3.5px]`}
      />
      <span
        className={`${cornerClass} bottom-0 right-0 z-10 rounded-br-sm border-b-[3.5px] border-r-[3.5px]`}
      />
    </div>
  )
}
