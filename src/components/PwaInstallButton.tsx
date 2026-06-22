import { useState } from 'react'
import { usePwaInstall } from '../hooks/usePwaInstall'

type PwaInstallButtonProps = {
  variant?: 'header' | 'compact'
  className?: string
}

export default function PwaInstallButton({
  variant = 'header',
  className = '',
}: PwaInstallButtonProps) {
  const { canInstall, canNativeInstall, install, installed, isIos } =
    usePwaInstall()
  const [iosOpen, setIosOpen] = useState(false)

  if (installed || !canInstall) return null

  const handleClick = async () => {
    if (canNativeInstall) {
      await install()
      return
    }
    if (isIos) setIosOpen(true)
  }

  const baseClass =
    variant === 'compact'
      ? 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-zinc-950/70 text-white shadow-lg backdrop-blur-md transition hover:border-white/30 hover:bg-zinc-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400'
      : 'inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400'

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`${baseClass} ${className}`.trim()}
        aria-label="Install Seymour Pay app"
      >
        <DownloadIcon className={variant === 'compact' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        {variant === 'header' ? <span>Install</span> : null}
      </button>

      {iosOpen ? (
        <div
          className="fixed inset-0 z-20000 flex items-end justify-center bg-zinc-950/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-ios-install-title"
        >
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2
              id="pwa-ios-install-title"
              className="text-lg font-bold text-zinc-950"
            >
              Install Seymour Pay
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Opens on the scan screen for quick ticket payment. Tap{' '}
              <span className="font-semibold text-zinc-800">Share</span>, then{' '}
              <span className="font-semibold text-zinc-800">
                Add to Home Screen
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => setIosOpen(false)}
              className="mt-5 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 11.25 12 15.75m0 0 4.5-4.5M12 15.75V3"
      />
    </svg>
  )
}
