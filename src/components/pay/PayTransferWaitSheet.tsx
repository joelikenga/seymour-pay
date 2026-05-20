import { useEffect, useId, useRef, useState } from 'react'
import {
  formatRemaining,
  TRANSFER_WAIT_DISPLAY_MS,
  TRANSFER_WAIT_REAL_MS,
} from '../../pages/pay/payFlowShared'
import PayOverlay, { PayOverlayDragHandle } from './PayOverlay'

type PayTransferWaitSheetProps = {
  open: boolean
  onComplete: () => void
  displayRemainingMs: number
}

export function useTransferWaitCountdown(active: boolean) {
  const [displayRemainingMs, setDisplayRemainingMs] = useState(TRANSFER_WAIT_DISPLAY_MS)

  useEffect(() => {
    if (!active) {
      setDisplayRemainingMs(TRANSFER_WAIT_DISPLAY_MS)
      return
    }

    const started = Date.now()
    const tick = () => {
      const elapsed = Date.now() - started
      const progress = Math.min(1, elapsed / TRANSFER_WAIT_REAL_MS)
      setDisplayRemainingMs(Math.max(0, TRANSFER_WAIT_DISPLAY_MS * (1 - progress)))
    }

    tick()
    const id = window.setInterval(tick, 50)
    return () => window.clearInterval(id)
  }, [active])

  return displayRemainingMs
}

export default function PayTransferWaitSheet({
  open,
  onComplete,
  displayRemainingMs,
}: PayTransferWaitSheetProps) {
  const titleId = useId()
  const completedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      completedRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (!open || completedRef.current) return
    if (displayRemainingMs > 0) return
    completedRef.current = true
    onComplete()
  }, [open, displayRemainingMs, onComplete])

  return (
    <PayOverlay open={open} titleId={titleId}>
      <PayOverlayDragHandle />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-2 text-center lg:px-8 lg:py-8 lg:pt-6">
        <h2 id={titleId} className="text-sm font-medium text-zinc-500">
          Confirming transfer
        </h2>

        <p
          className="mt-4 font-mono text-5xl font-semibold tabular-nums tracking-tight text-zinc-950 sm:text-6xl"
          aria-live="polite"
        >
          {formatRemaining(displayRemainingMs)}
        </p>

        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Waiting for payment confirmation
        </p>

        <p className="mt-5 text-sm leading-relaxed text-zinc-600">
          We are checking for your transfer. Please keep this page open.
        </p>

        <div className="mt-auto flex justify-center pt-8 lg:pt-10">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-orange-100 border-t-orange-600"
            aria-hidden
          />
        </div>
      </div>
    </PayOverlay>
  )
}
