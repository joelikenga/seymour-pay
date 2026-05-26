import { useCallback, useEffect, useRef, useState } from 'react'

const DISMISS_KEY = 'seymour-pwa-install-dismissed'
const INSTALLED_KEY = 'seymour-pwa-installed'
/** Same SVG as the in-app Seymour logo (`/public/logo 1.svg`). */
const LOGO_SRC = '/logo%201.svg'

type BeforeInstallPromptEventExtended = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false

  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true

  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) return true

  try {
    if (localStorage.getItem(INSTALLED_KEY) === '1') return true
  } catch {
    /* ignore */
  }

  return false
}

function markPwaInstalled(): void {
  try {
    localStorage.setItem(INSTALLED_KEY, '1')
  } catch {
    /* ignore */
  }
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function isIosBrowser(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export default function PwaInstallPrompt() {
  const iosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEventExtended | null>(null)
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
    if (isPwaInstalled()) return

    const onBip = (e: Event) => {
      e.preventDefault()
      if (isPwaInstalled() || isDismissed()) return
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
      markPwaInstalled()
      setOpen(false)
      setDeferred(null)
      setShowIosHint(false)
    }
    window.addEventListener('appinstalled', onInstalled)

    if (isIosBrowser()) {
      iosTimerRef.current = setTimeout(() => {
        if (isPwaInstalled() || isDismissed()) return
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
    if (deferred) {
      try {
        await deferred.prompt()
        const { outcome } = await deferred.userChoice
        if (outcome === 'accepted') markPwaInstalled()
      } catch {
        /* user dismissed native prompt */
      }
      setDeferred(null)
      setOpen(false)
      return
    }

    if (showIosHint) dismiss()
  }

  if (!open || isPwaInstalled()) return null

  const canNativeInstall = Boolean(deferred)

  return (
    <div
      className="fixed inset-0 z-20000 flex items-center justify-center bg-zinc-950/60 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div className="relative w-full max-w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-zinc-950/5">
        <button
          type="button"
          onClick={dismiss}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          aria-label="Cancel"
        >
          <CloseIcon />
        </button>

        <div className="px-6 pb-6 pt-12 text-center">
          <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[22px] border border-zinc-200/90 bg-linear-to-br from-white to-zinc-50 p-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] ring-1 ring-zinc-950/5">
            <img
              src={LOGO_SRC}
              alt=""
              width={72}
              height={72}
              className="h-full w-full object-contain object-center"
              decoding="async"
            />
          </div>

          <h2
            id="pwa-install-title"
            className="mt-5 text-xl font-bold tracking-tight text-zinc-950"
          >
            Install Seymour Pay
          </h2>

          {showIosHint && !canNativeInstall ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Add this app to your Home Screen for quick access and a full-screen
              checkout experience. Tap{' '}
              <span className="font-semibold text-zinc-800">Share</span>, then{' '}
              <span className="font-semibold text-zinc-800">
                Add to Home Screen
              </span>
              .
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Download the app for one-tap launch from your home screen, a
              full-screen experience, and automatic updates when you&apos;re
              online.
            </p>
          )}

          <button
            type="button"
            onClick={() => void install()}
            className="mt-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            <DownloadIcon />
            Install
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
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
