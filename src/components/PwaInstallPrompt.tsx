import { useCallback, useEffect, useRef, useState } from 'react'

const DISMISS_KEY = 'seymour-pwa-install-dismissed'

type BeforeInstallPromptEventExtended = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isInstalledStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

export default function PwaInstallPrompt() {
  const iosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventExtended | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [open, setOpen] = useState(false)

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
    setDeferred(null)
    setShowIosHint(false)
  }, [])

  useEffect(() => {
    if (isInstalledStandalone()) return
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault()
      try {
        if (localStorage.getItem(DISMISS_KEY) === '1') return
      } catch {
        /* ignore */
      }
      if (iosTimerRef.current) {
        clearTimeout(iosTimerRef.current)
        iosTimerRef.current = null
      }
      setShowIosHint(false)
      setDeferred(e as BeforeInstallPromptEventExtended)
      setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)

    const onInstalled = () => {
      setOpen(false)
      setDeferred(null)
      setShowIosHint(false)
    }
    window.addEventListener('appinstalled', onInstalled)

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const nav = window.navigator as Navigator & { standalone?: boolean }
    if (isIos && !nav.standalone) {
      iosTimerRef.current = setTimeout(() => {
        try {
          if (localStorage.getItem(DISMISS_KEY) === '1') return
        } catch {
          /* ignore */
        }
        setShowIosHint(true)
        setOpen(true)
      }, 2200)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
      if (iosTimerRef.current) {
        clearTimeout(iosTimerRef.current)
        iosTimerRef.current = null
      }
    }
  }, [])

  const install = async () => {
    if (!deferred) return
    try {
      await deferred.prompt()
      await deferred.userChoice
    } catch {
      /* user dismissed native prompt */
    }
    setDeferred(null)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div className="w-full max-w-md rounded-t-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 text-2xl font-bold text-white shadow-md">
            S
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="pwa-install-title" className="text-lg font-bold text-zinc-950">
              Install Seymour Pay
            </h2>
            {showIosHint && !deferred ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Add this app to your Home Screen for faster checkout and offline-friendly access.
                Tap{' '}
                <span className="font-semibold text-zinc-800">Share</span>, then{' '}
                <span className="font-semibold text-zinc-800">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Download the app to your device — quick launch from your home screen, full-screen
                experience, and automatic updates when you&apos;re online.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
          {deferred ? (
            <button
              type="button"
              onClick={() => void install()}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-orange-700 active:scale-[0.99] sm:max-w-[200px]"
            >
              Download / Install
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:max-w-[140px]"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
