import { useId, useState } from 'react'
import QRCode from 'react-qr-code'
import { payBtnSecondary } from '../../pages/pay/payUi'
import PayOverlay, { PayOverlayDragHandle } from './PayOverlay'

const DEFAULT_SIZE = 84
const DEFAULT_EXPANDED_SIZE = 240

type PayExpandableQrCodeProps = {
  value: string
  size?: number
  expandedSize?: number
  ariaLabel: string
  title?: string
  caption?: string
  /** Show tap/click hint under thumbnail QR. */
  showEnlargeHint?: boolean
}

export default function PayExpandableQrCode({
  value,
  size = DEFAULT_SIZE,
  expandedSize = DEFAULT_EXPANDED_SIZE,
  ariaLabel,
  title = 'Ticket QR code',
  caption,
  showEnlargeHint = true,
}: PayExpandableQrCodeProps) {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  const qrStyle = (px: number) =>
    ({
      height: 'auto',
      maxWidth: '100%',
      width: `${px}px`,
      display: 'block',
    }) as const

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group shrink-0 rounded-lg border border-zinc-100 bg-white p-1.5 text-left transition hover:border-zinc-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 active:scale-[0.98]"
        aria-label={`${ariaLabel}. Tap to enlarge`}
      >
        <QRCode
          value={value}
          size={size}
          style={qrStyle(size)}
          viewBox="0 0 256 256"
        />
        {showEnlargeHint ? (
          <span className="mt-1 block text-center text-[10px] font-medium text-zinc-400 transition group-hover:text-zinc-500 max-lg:group-active:text-zinc-600">
            <span className="lg:hidden">Tap to enlarge</span>
            <span className="hidden lg:inline">Click to enlarge</span>
          </span>
        ) : null}
      </button>

      <PayOverlay
        open={open}
        titleId={titleId}
        compact
        onBackdropClick={() => setOpen(false)}
      >
        <PayOverlayDragHandle />

        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pb-4 pt-2 text-center lg:px-8 lg:py-8 lg:pt-6">
          <h2 id={titleId} className="text-sm font-medium text-zinc-500">
            {title}
          </h2>

          <div className="mt-5 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <QRCode
              value={value}
              size={expandedSize}
              style={qrStyle(expandedSize)}
              viewBox="0 0 256 256"
            />
          </div>

          <p className="mt-4 max-w-full break-all font-mono text-sm font-semibold text-zinc-900">
            {value}
          </p>

          {caption ? (
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{caption}</p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-zinc-100 px-6 py-4 lg:px-8 lg:py-5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`mx-auto block max-w-sm ${payBtnSecondary}`}
          >
            Close
          </button>
        </div>
      </PayOverlay>
    </>
  )
}
