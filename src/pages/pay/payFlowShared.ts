import type { CSSProperties } from 'react'

/** Steps in checkout carousel: details → method → terms → processing → receipt */
export const CAROUSEL_STEPS = 5

export const slidePanelStyle: CSSProperties = {
  flex: `0 0 calc(100% / ${CAROUSEL_STEPS})`,
  minWidth: 0,
  boxSizing: 'border-box',
}

export const EXIT_WINDOW_MS = 20 * 60 * 1000
export const EXIT_REMINDER_MS = 5 * 60 * 1000

export const EXIT_WINDOW_COPY =
  'You have 20 minutes from payment confirmation to leave the facility. After that, additional charges may apply.'

export const DESKTOP_MEDIA = '(min-width: 1024px)'

export function isDesktopViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA).matches
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export const PAY_SHELL_OUTER =
  'client-touch-scroll flex min-h-dvh justify-center text-zinc-900 max-lg:bg-linear-to-br max-lg:from-zinc-200 max-lg:via-zinc-300 max-lg:to-zinc-400 max-lg:sm:items-center max-lg:sm:px-4 max-lg:sm:py-6 lg:items-center lg:bg-zinc-100 lg:px-8 lg:py-10'

/** Default QR payload on desktop enter-ticket before a ticket ID is typed. */
export const DEFAULT_TICKET_QR_URL = 'www.seymouraviation.ng'

/** Square scan frame vs camera viewfinder (smaller = more zoomed-out feel). */
export const SCAN_VIEWFINDER_RATIO = 0.72

/** Delay after scan capture before checkout (simulated ticket lookup). */
export const SCAN_CAPTURE_LOADING_MS = 5000

export const PAY_TICKET_ID_PARAM = 'ticketID'

const SEYMOUR_PAY_QR_URL =
  /^https?:\/\/(?:www\.)?seymouraviation\.ng\/pay(?:\?|$)/i

/** Raw QR payload → ticket ID (strips Seymour pay URLs). */
export function parseScannedTicketId(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  if (!SEYMOUR_PAY_QR_URL.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    const fromParam = url.searchParams.get(PAY_TICKET_ID_PARAM)?.trim()
    if (fromParam) return fromParam
  } catch {
    /* fall through to regex */
  }

  const match = trimmed.match(/[?&]ticketID=([^&#]+)/i)
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]).trim()
    } catch {
      return match[1].trim()
    }
  }

  return trimmed
}

export const PAY_SHELL_INNER =
  'flex h-dvh max-h-dvh w-full max-w-[428px] min-h-0 flex-col overflow-hidden bg-zinc-50 sm:h-[min(100dvh,880px)] sm:max-h-[min(100dvh,880px)] sm:rounded-[2.5rem] sm:shadow-[0_25px_80px_-16px_rgba(0,0,0,0.45)] sm:ring-1 sm:ring-white/60 lg:h-auto lg:max-h-[calc(100dvh-4rem)] lg:min-h-[min(84vh,900px)] lg:w-full lg:max-w-6xl lg:rounded-2xl lg:border lg:border-zinc-200/90 lg:bg-white lg:shadow-[0_24px_64px_-28px_rgba(15,23,42,0.14)] lg:ring-0'
