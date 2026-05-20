import { useId } from 'react'
import { EXIT_WINDOW_COPY, formatRemaining } from '../../pages/pay/payFlowShared'
import { payBtnSecondary } from '../../pages/pay/payUi'
import PayOverlay, { PayOverlayDragHandle } from './PayOverlay'

type PayExitTimerSheetProps = {
  open: boolean
  onClose: () => void
  remainingMs: number | null
  expired: boolean
  reminderNote?: string
}

export default function PayExitTimerSheet({
  open,
  onClose,
  remainingMs,
  expired,
  reminderNote,
}: PayExitTimerSheetProps) {
  const titleId = useId()

  const displayTime =
    remainingMs != null && remainingMs > 0
      ? formatRemaining(remainingMs)
      : expired
        ? '0:00'
        : '-'

  return (
    <PayOverlay open={open} titleId={titleId} onBackdropClick={onClose} tall>
      <PayOverlayDragHandle />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-2 text-center lg:px-8 lg:py-8 lg:pt-6">
        <h2 id={titleId} className="text-sm font-medium text-zinc-500">
          {expired ? 'Exit window ended' : 'Time to leave'}
        </h2>

        <p
          className="mt-4 font-mono text-5xl font-semibold tabular-nums tracking-tight text-zinc-950 sm:text-6xl"
          aria-live="polite"
        >
          {displayTime}
        </p>

        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {expired ? 'Window closed' : '20-minute exit window'}
        </p>

        <p className="mt-5 text-sm leading-relaxed text-zinc-600">
          {expired
            ? 'Your exit window has closed. Return to your receipt to review any extra parking charges.'
            : (reminderNote ?? EXIT_WINDOW_COPY)}
        </p>
      </div>

      <div className="shrink-0 border-t border-zinc-100 px-6 py-4 lg:px-8 lg:py-5">
        <button
          type="button"
          onClick={onClose}
          className={`mx-auto block max-w-sm ${payBtnSecondary}`}
        >
          Back to receipt
        </button>
      </div>
    </PayOverlay>
  )
}
