import { useId } from 'react'
import { EXIT_WINDOW_COPY, formatRemaining } from '../../pages/pay/payFlowShared'
import { payBtnPrimary } from '../../pages/pay/payUi'

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

  if (!open) return null

  const displayTime =
    remainingMs != null && remainingMs > 0
      ? formatRemaining(remainingMs)
      : expired
        ? '0:00'
        : '—'

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-zinc-950/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pay-exit-sheet-panel flex max-h-[min(50dvh,28rem)] min-h-[min(48dvh,26rem)] w-full flex-col rounded-t-2xl border-t border-zinc-200 bg-white shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.18)]"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-2 text-center">
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
            {reminderNote ?? EXIT_WINDOW_COPY}
          </p>

          <button
            type="button"
            onClick={onClose}
            className={`mt-auto pt-6 ${payBtnPrimary}`}
          >
            {expired ? 'Close' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  )
}
