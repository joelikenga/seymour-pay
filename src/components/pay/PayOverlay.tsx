import type { ReactNode } from 'react'

type PayOverlayProps = {
  open: boolean
  titleId: string
  onBackdropClick?: () => void
  /** Taller sheet on mobile (exit timer). */
  tall?: boolean
  /** Shorter sheet on mobile (QR enlarge). */
  compact?: boolean
  children: ReactNode
}

export function PayOverlayDragHandle() {
  return (
    <div className="flex shrink-0 justify-center pt-3 pb-1 lg:hidden" aria-hidden>
      <span className="h-1 w-10 rounded-full bg-zinc-200" />
    </div>
  )
}

export default function PayOverlay({
  open,
  titleId,
  onBackdropClick,
  tall = false,
  compact = false,
  children,
}: PayOverlayProps) {
  if (!open) return null

  const mobileHeightClass = tall
    ? 'max-h-[min(50dvh,28rem)] min-h-[min(48dvh,26rem)] lg:min-h-0 lg:max-h-none'
    : compact
      ? 'max-h-[min(85dvh,36rem)] lg:min-h-0 lg:max-h-none'
      : 'max-h-[min(50dvh,28rem)] min-h-[min(42dvh,22rem)] lg:min-h-0 lg:max-h-none'

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-zinc-950/40 lg:items-center lg:justify-center lg:bg-zinc-950/50 lg:p-6 lg:backdrop-blur-sm"
      role="presentation"
      onClick={onBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`pay-overlay-panel flex w-full flex-col border-zinc-200 bg-white ${mobileHeightClass} rounded-t-2xl border-t shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.18)] lg:max-w-md lg:rounded-2xl lg:border lg:shadow-[0_24px_64px_-24px_rgba(15,23,42,0.28)]`}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
