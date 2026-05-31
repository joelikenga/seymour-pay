import type { CSSProperties } from 'react'

/** Payment carousel panels: method → terms → processing → receipt */
export const PAYMENT_CAROUSEL_STEPS = 4

export const paymentSlidePanelStyle: CSSProperties = {
  flex: `0 0 calc(100% / ${PAYMENT_CAROUSEL_STEPS})`,
  minWidth: 0,
  boxSizing: 'border-box',
}

export const EXIT_WINDOW_MS = 20 * 60 * 1000
export const EXIT_REMINDER_MS = 5 * 60 * 1000

/** Delay before exit timer sheet slides up after receipt is shown. */
export const EXIT_SHEET_DELAY_MS = 2000

export const EXIT_WINDOW_COPY =
  'You have 20 minutes from payment confirmation to leave the facility. After that, additional charges may apply.'

export const PAY_DEMO_VIRTUAL_ACCOUNT = '4012345678'
export const PAY_DEMO_BANK_NAME = 'Fidelity Bank Plc'
export const PAY_DEMO_ACCOUNT_NAME = 'Seymour Aviation Ltd.'

/** Transfer wait sheet: shows a 5-minute countdown but completes in 5 seconds (demo). */
export const TRANSFER_WAIT_DISPLAY_MS = 5 * 60 * 1000
export const TRANSFER_WAIT_REAL_MS = 5000

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
  'client-touch-scroll flex min-h-dvh justify-center text-zinc-900 max-lg:bg-linear-to-br max-lg:from-zinc-200 max-lg:via-zinc-300 max-lg:to-zinc-400 max-lg:sm:items-center max-lg:sm:px-4 max-lg:sm:py-6'

/** Full-width pay app on desktop (no phone frame). */
export const PAY_SHELL_OUTER_DESKTOP =
  'client-touch-scroll flex min-h-dvh flex-col bg-zinc-100 text-zinc-900'

export const PAY_SHELL_INNER_DESKTOP =
  'relative flex min-h-dvh w-full max-w-none flex-col overflow-hidden bg-zinc-50'

/** Page body: full-screen overlay on mobile, normal scroll region on desktop. */
export const PAY_PAGE_MAIN =
  'client-touch-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain max-lg:absolute max-lg:inset-0 max-lg:z-0 max-lg:bg-zinc-100'

/** Top inset when mobile shell shows the fixed logo bar (manual entry + history). */
export const PAY_MOBILE_TOP_BAR_OFFSET =
  'max-lg:pt-[calc(3.5rem+max(0.75rem,env(safe-area-inset-top)))]'

/** Bottom inset so scroll content clears the floating mobile tab bar. */
export const PAY_MOBILE_NAV_CLEARANCE =
  'max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'

export const PAY_PAGE_INNER = 'mx-auto w-full max-w-lg px-4 py-5 sm:py-6 lg:max-w-3xl lg:px-8 lg:py-10'

/** Default QR payload on desktop enter-ticket before a ticket ID is typed. */
export const DEFAULT_TICKET_QR_URL = 'www.seymouraviation.ng'

/** Square scan frame vs camera viewfinder (smaller = more zoomed-out feel). */
export const SCAN_VIEWFINDER_RATIO = 0.72

/** Shared size for yellow-corner viewfinder + camera preview. */
export const PAY_SCAN_VIEWFINDER_CLASS =
  'aspect-square w-[min(72vw,58vh)] max-w-[300px]'

/** Query param kept for legacy QR / bookmark URLs — prefer path routes below. */
export const PAY_TICKET_ID_PARAM = 'ticketID'

/** @deprecated Legacy checkout flag — use `/pay/ticket/:id/payment` instead. */
export const PAY_STEP_PARAM = 'pay'

export const PAY_STEP_CHECKOUT = '1'

/** @deprecated Legacy extra flag — use `/pay/ticket/:id/extra` instead. */
export const PAY_EXTRA_PARAM = 'extra'

export const PAY_EXTRA_VALUE = '1'

function encodeTicketId(ticketId: string): string {
  return encodeURIComponent(ticketId.trim())
}

/** Ticket fee preview: `/pay/ticket/:ticketId` */
export function payTicketPreviewUrl(ticketId: string, extra?: boolean): string {
  const id = encodeTicketId(ticketId)
  return extra ? `/pay/ticket/${id}/extra` : `/pay/ticket/${id}`
}

/** Payment checkout: `/pay/ticket/:ticketId/payment` */
export function payTicketPaymentUrl(ticketId: string, extra?: boolean): string {
  const id = encodeTicketId(ticketId)
  return extra ? `/pay/ticket/${id}/extra/payment` : `/pay/ticket/${id}/payment`
}

/** @deprecated Alias for {@link payTicketPreviewUrl}. */
export function payTicketUrl(ticketId: string, extra?: boolean): string {
  return payTicketPreviewUrl(ticketId, extra)
}

/** Overstay / extra parking preview: `/pay/ticket/:ticketId/extra` */
export function payExtraTicketUrl(ticketId: string): string {
  return payTicketPreviewUrl(ticketId, true)
}

/** Extra payment checkout: `/pay/ticket/:ticketId/extra/payment` */
export function payExtraTicketCheckoutUrl(ticketId: string): string {
  return payTicketPaymentUrl(ticketId, true)
}

/** @deprecated Alias for {@link payTicketPaymentUrl}. */
export function payTicketCheckoutUrl(ticketId: string, extra?: boolean): string {
  return payTicketPaymentUrl(ticketId, extra)
}

export function isPayExtraStep(searchParams: URLSearchParams): boolean {
  return searchParams.get(PAY_EXTRA_PARAM) === PAY_EXTRA_VALUE
}

export function isPayCheckoutStep(searchParams: URLSearchParams): boolean {
  return searchParams.get(PAY_STEP_PARAM) === PAY_STEP_CHECKOUT
}

/** Maps legacy `?ticketID=…&pay=1&extra=1` URLs to path routes. */
export function resolveLegacyPayQueryRedirect(
  searchParams: URLSearchParams,
): string | null {
  const ticketId = searchParams.get(PAY_TICKET_ID_PARAM)?.trim()
  if (!ticketId) return null
  const extra = isPayExtraStep(searchParams)
  const checkout = isPayCheckoutStep(searchParams)
  return checkout
    ? payTicketPaymentUrl(ticketId, extra)
    : payTicketPreviewUrl(ticketId, extra)
}

export function isPayExtraPath(pathname: string): boolean {
  return /\/extra(?:\/|$)/.test(pathname)
}

export function decodePayTicketParam(raw: string | undefined): string {
  if (!raw?.trim()) return ''
  try {
    return decodeURIComponent(raw.trim())
  } catch {
    return raw.trim()
  }
}

const SEYMOUR_PAY_QR_URL =
  /^https?:\/\/(?:www\.)?seymouraviation\.ng\/pay(?:\/|\?|$)/i

const SEYMOUR_PAY_PATH = /seymouraviation\.ng\/pay(?:\/|\?|$)/i

const SEYMOUR_PAY_TICKET_PATH = /\/pay\/ticket\/([^/?#]+)/i

function normalizeScannedPayload(raw: string): string {
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^(?:www\.)?seymouraviation\.ng\//i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}

/** Raw QR payload → ticket ID (strips Seymour pay URLs). */
export function parseScannedTicketId(raw: string): string {
  const normalized = normalizeScannedPayload(raw)
  if (!normalized) return ''

  const pathMatch = normalized.match(SEYMOUR_PAY_TICKET_PATH)
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1]).trim()
    } catch {
      return pathMatch[1].trim()
    }
  }

  const isSeymourPay =
    SEYMOUR_PAY_QR_URL.test(normalized) ||
    (SEYMOUR_PAY_PATH.test(normalized) &&
      (/[?&]ticketID=/i.test(normalized) || SEYMOUR_PAY_TICKET_PATH.test(normalized)))

  if (!isSeymourPay) return normalized

  try {
    const url = new URL(normalized)
    const fromParam = url.searchParams.get(PAY_TICKET_ID_PARAM)?.trim()
    if (fromParam) return fromParam
  } catch {
    /* fall through to regex */
  }

  const match = normalized.match(/[?&]ticketID=([^&#]+)/i)
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]).trim()
    } catch {
      return match[1].trim()
    }
  }

  return normalized
}

/** qrbox must not exceed the camera viewfinder (html5-qrcode requirement). */
export function computeScanQrBox(
  viewfinderW: number,
  viewfinderH: number,
  framePx?: { width: number; height: number },
): { width: number; height: number } {
  const maxW = Math.floor(viewfinderW * 0.92)
  const maxH = Math.floor(viewfinderH * 0.92)
  let side = Math.floor(
    Math.min(viewfinderW, viewfinderH) * SCAN_VIEWFINDER_RATIO,
  )
  if (framePx && framePx.width > 0 && framePx.height > 0) {
    side = Math.floor(Math.min(framePx.width, framePx.height, side))
  }
  side = Math.min(side, maxW, maxH)
  side = Math.max(80, Math.min(side, maxW, maxH))
  return { width: side, height: side }
}

export const PAY_SHELL_INNER =
  'flex h-dvh max-h-dvh w-full max-w-[428px] min-h-0 flex-col overflow-hidden bg-zinc-100 sm:h-[min(100dvh,880px)] sm:max-h-[min(100dvh,880px)] sm:rounded-[2.5rem] sm:shadow-[0_25px_80px_-16px_rgba(0,0,0,0.45)] sm:ring-1 sm:ring-white/60 lg:h-auto lg:max-h-[calc(100dvh-4rem)] lg:min-h-[min(84vh,900px)] lg:w-full lg:max-w-6xl lg:rounded-2xl lg:border lg:border-zinc-200/90 lg:bg-white lg:shadow-[0_24px_64px_-28px_rgba(15,23,42,0.14)] lg:ring-0'
