import { Html5Qrcode } from 'html5-qrcode'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import QRCode from 'react-qr-code'
import { useSearchParams } from 'react-router-dom'
import SeymourLogo from '../../components/SeymourLogo'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import {
  appendPayTransaction,
  clearPayTransactions,
  loadPayTransactions,
} from '../../lib/payTransactionHistory'
import type { PayMethod, PayTicketDetails } from '../../types/ticketPay'
import { fetchPayTicketById } from '../../utils/api/services/ticketPayApi'

/** Steps after scan: details → method → terms → processing → receipt */
const CAROUSEL_STEPS = 5

const slidePanelStyle: CSSProperties = {
  flex: `0 0 calc(100% / ${CAROUSEL_STEPS})`,
  minWidth: 0,
  boxSizing: 'border-box',
}

/** Grace period after successful payment before extra charges may apply. */
const EXIT_WINDOW_MS = 20 * 60 * 1000

/** In-app reminder interval while the exit window is active. */
const EXIT_REMINDER_MS = 5 * 60 * 1000

const EXIT_WINDOW_COPY =
  'You have 20 minutes from payment confirmation to leave the facility. After that, additional charges may apply.'

type PayHomeTab = 'scan' | 'ticket' | 'history'

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TicketPayPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const reminderTitleId = useId()

  const [step, setStep] = useState(0)
  const [ticketInput, setTicketInput] = useState('')
  const [ticket, setTicket] = useState<PayTicketDetails | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  const [payMethod, setPayMethod] = useState<PayMethod | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [payProcessing, setPayProcessing] = useState(false)
  const [paymentRef, setPaymentRef] = useState<string | null>(null)
  const [paidAt, setPaidAt] = useState<string | null>(null)

  const [exitDeadline, setExitDeadline] = useState<number | null>(null)
  const [exitRemainingMs, setExitRemainingMs] = useState<number | null>(null)
  const [exitExpired, setExitExpired] = useState(false)

  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderBody, setReminderBody] = useState('')

  const scannerWrapRef = useRef<HTMLDivElement | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerStarted = useRef(false)
  const urlBootstrap = useRef(false)
  const lookupBusyRef = useRef(false)

  const [scannerError, setScannerError] = useState<string | null>(null)
  const [homeTab, setHomeTab] = useState<PayHomeTab>('scan')
  const [historyTick, setHistoryTick] = useState(0)
  const historyItems = useMemo(
    () => loadPayTransactions(),
    [historyTick],
  )

  const runLookup = useCallback(
    async (rawId: string) => {
      setLookupError(null)
      setLookupLoading(true)
      lookupBusyRef.current = true
      try {
        const details = await fetchPayTicketById(rawId)
        setTicket(details)
        setTicketInput(details.ticketId)
        setSearchParams(
          (prev) => {
            const p = new URLSearchParams(prev)
            p.set('ticketID', details.ticketId)
            return p
          },
          { replace: true },
        )
        setStep(1)
      } catch (e) {
        setTicket(null)
        setLookupError(e instanceof Error ? e.message : 'Could not load ticket.')
      } finally {
        setLookupLoading(false)
        lookupBusyRef.current = false
      }
    },
    [setSearchParams],
  )

  useEffect(() => {
    const fromUrl = searchParams.get('ticketID')?.trim()
    if (!fromUrl || urlBootstrap.current) return
    urlBootstrap.current = true
    setTicketInput(fromUrl)
    void runLookup(fromUrl)
  }, [searchParams, runLookup])

  useEffect(() => {
    if (step !== 0 || homeTab !== 'scan') {
      const s = scannerRef.current
      scannerRef.current = null
      scannerStarted.current = false
      if (s) {
        void s.stop().catch(() => {})
        s.clear()
      }
      return
    }

    let cancelled = false
    const start = async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
      if (cancelled) return
      const el = scannerWrapRef.current
      if (!el) return

      setScannerError(null)
      const regionId = 'pay-ticket-scanner-host'
      el.id = regionId

      const prev = scannerRef.current
      if (prev) {
        void prev.stop().catch(() => {})
        prev.clear()
        scannerRef.current = null
      }

      const html5 = new Html5Qrcode(regionId, false)
      scannerRef.current = html5

      const qrbox = (viewfinderW: number, viewfinderH: number) => {
        const w = Math.floor(viewfinderW * 0.94)
        const h = Math.floor(viewfinderH * 0.92)
        return { width: w, height: h }
      }

      const onScanSuccess = (decoded: string) => {
        const id = decoded?.trim()
        if (!id || lookupBusyRef.current) return
        void html5.pause(true)
        void runLookup(id).finally(() => {
          void html5.resume()
        })
      }
      const onScanFailure = () => {}

      const tryStart = async (constraints: { facingMode: string }) =>
        html5.start(
          constraints,
          { fps: 12, qrbox },
          onScanSuccess,
          onScanFailure,
        )

      try {
        await tryStart({ facingMode: 'environment' })
        scannerStarted.current = true
      } catch {
        try {
          await tryStart({ facingMode: 'user' })
          scannerStarted.current = true
        } catch (e) {
          scannerRef.current = null
          scannerStarted.current = false
          const msg =
            e instanceof Error ? e.message : 'Could not start the camera.'
          setScannerError(
            /Permission|permission|denied|NotAllowed/i.test(msg)
              ? 'Camera access was blocked. Allow the camera for this site, or type your ticket ID below.'
              : `${msg} You can type your ticket ID below instead.`,
          )
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      const s = scannerRef.current
      scannerRef.current = null
      scannerStarted.current = false
      if (s) {
        void s.stop().catch(() => {})
        s.clear()
      }
    }
  }, [step, homeTab, runLookup])

  useEffect(() => {
    if (exitDeadline == null || exitExpired || step !== 5) {
      setExitRemainingMs(null)
      return
    }
    const tick = () => {
      const left = exitDeadline - Date.now()
      setExitRemainingMs(left)
      if (left <= 0) setExitExpired(true)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [exitDeadline, exitExpired, step])

  useEffect(() => {
    if (step !== 5 || exitExpired || exitDeadline == null) return
    const id = window.setInterval(() => {
      const left = exitDeadline - Date.now()
      if (left <= 0) return
      setReminderBody(
        `You have ${formatRemaining(left)} left to exit. After your 20-minute window ends, additional charges may apply.`,
      )
      setReminderOpen(true)
    }, EXIT_REMINDER_MS)
    return () => window.clearInterval(id)
  }, [step, exitExpired, exitDeadline])

  const goMethodStep = () => {
    setPayMethod(null)
    setTermsAccepted(false)
    setStep(2)
  }

  const goTermsStep = () => {
    if (!payMethod) return
    setTermsAccepted(false)
    setStep(3)
  }

  const runPaySimulation = async () => {
    if (!ticket || !payMethod || !termsAccepted) return
    setStep(4)
    setPayProcessing(true)
    await new Promise((r) => setTimeout(r, 2200))
    const ref = `PAY-${Date.now().toString(36).toUpperCase()}`
    const paidAtIso = new Date().toISOString()
    setPaymentRef(ref)
    setPaidAt(paidAtIso)
    setPayProcessing(false)
    setExitExpired(false)
    setExitDeadline(Date.now() + EXIT_WINDOW_MS)
    setExitRemainingMs(EXIT_WINDOW_MS)
    appendPayTransaction({
      ticketId: ticket.ticketId,
      amount: ticket.amountDue,
      currency: ticket.currency,
      paymentRef: ref,
      paidAt: paidAtIso,
      payMethod,
    })
    setHistoryTick((t) => t + 1)
    setStep(5)
  }

  const restartPaymentMethod = () => {
    setExitExpired(false)
    setExitDeadline(null)
    setExitRemainingMs(null)
    setPaymentRef(null)
    setPaidAt(null)
    setPayMethod(null)
    setTermsAccepted(false)
    setReminderOpen(false)
    setStep(2)
  }

  const carouselIndex = step >= 1 ? step - 1 : 0

  return (
    <div
      className="client-touch-scroll flex min-h-dvh justify-center text-zinc-900 max-lg:bg-linear-to-br max-lg:from-zinc-200 max-lg:via-zinc-300 max-lg:to-zinc-400 max-lg:sm:items-center max-lg:sm:px-4 max-lg:sm:py-6 lg:items-center lg:bg-zinc-100 lg:px-8 lg:py-10"
    >
      <div
        className="flex h-dvh max-h-dvh w-full max-w-[428px] min-h-0 flex-col overflow-hidden bg-zinc-50 sm:h-[min(100dvh,880px)] sm:max-h-[min(100dvh,880px)] sm:rounded-[2.5rem] sm:shadow-[0_25px_80px_-16px_rgba(0,0,0,0.45)] sm:ring-1 sm:ring-white/60 lg:h-auto lg:max-h-[calc(100dvh-5rem)] lg:min-h-[28rem] lg:w-full lg:max-w-6xl lg:rounded-2xl lg:border lg:border-zinc-200/90 lg:bg-white lg:shadow-[0_24px_64px_-28px_rgba(15,23,42,0.14)] lg:ring-0"
        style={{
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
      {step === 0 ? (
        <div className="relative flex min-h-0 flex-1 basis-0 flex-col">
          <div className="hidden lg:flex lg:shrink-0 lg:items-center lg:justify-between lg:gap-8 lg:border-b lg:border-zinc-200/90 lg:bg-zinc-50/90 lg:px-8 lg:py-4">
            <SeymourLogo className="scale-95" />
            <nav
              className="flex rounded-xl bg-zinc-200/60 p-1 shadow-inner ring-1 ring-zinc-950/5"
              role="tablist"
              aria-label="Pay views"
            >
              <button
                type="button"
                role="tab"
                aria-selected={homeTab === 'scan'}
                onClick={() => setHomeTab('scan')}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                  homeTab === 'scan'
                    ? 'bg-white text-orange-600 shadow-sm ring-1 ring-zinc-900/8'
                    : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900'
                }`}
              >
                Scan
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={homeTab === 'ticket'}
                onClick={() => setHomeTab('ticket')}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                  homeTab === 'ticket'
                    ? 'bg-white text-orange-600 shadow-sm ring-1 ring-zinc-900/8'
                    : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900'
                }`}
              >
                Enter ticket
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={homeTab === 'history'}
                onClick={() => setHomeTab('history')}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                  homeTab === 'history'
                    ? 'bg-white text-orange-600 shadow-sm ring-1 ring-zinc-900/8'
                    : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900'
                }`}
              >
                History
              </button>
            </nav>
          </div>

          <div
            className={`relative min-h-0 flex-1 basis-0 w-full ${
              homeTab === 'scan'
                ? 'bg-black lg:min-h-[min(70vh,720px)]'
                : 'bg-zinc-100'
            }`}
          >
            {homeTab === 'scan' ? (
              <>
                <div
                  ref={scannerWrapRef}
                  className="pay-scanner-host absolute inset-0 z-0 overflow-hi dden bg-zinc-950 lg:rounded-b-xl h-screen"
                />
                <div
                  className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-zinc-950/65 via-transparent to-zinc-950/80 lg:rounded-b-xl"
                  aria-hidden
                />
                <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center px-4 pt-[max(0.85rem,env(safe-area-inset-top))] lg:hidden">
                  <SeymourLogo
                    className="scale-[0.88] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] [&_img]:brightness-0 [&_img]:invert"
                    markOnly
                  />
                </header>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/80 via-black/30 to-transparent px-4 pb-24 pt-14 lg:rounded-b-xl lg:pb-8">
                  <p className="text-center text-sm font-medium leading-snug text-white drop-shadow-md lg:text-base">
                    Point at the ticket QR or barcode to scan.
                  </p>
                  {scannerError ? (
                    <p
                      className="mx-auto mt-3 max-w-sm rounded-lg bg-amber-400/95 px-3 py-2 text-center text-sm font-medium text-amber-950"
                      role="status"
                    >
                      {scannerError}
                    </p>
                  ) : null}
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-400 drop-shadow-md lg:text-xs">
                    Prefer typing? Use{' '}
                    <span className="font-semibold text-white">Enter ticket</span>{' '}
                    <span className="lg:hidden">in the bar below.</span>
                    <span className="hidden lg:inline">in the bar above.</span>
                  </p>
                </div>
              </>
            ) : null}

            {homeTab === 'ticket' ? (
              <div className="h-full min-h-0 overflow-y-auto overscroll-contain pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-10 lg:pb-10 lg:pt-8">
                <div className="mx-auto w-full max-w-md px-4 pb-24 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-12 lg:px-0 lg:pb-0">
                  <div className="lg:text-left">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-600/90 lg:text-left">
                      Manual entry
                    </p>
                    <h1 className="mt-1 text-center text-xl font-bold tracking-tight text-zinc-950 lg:text-left lg:text-2xl">
                      Enter ticket
                    </h1>
                    <p className="mt-2 text-center text-sm leading-relaxed text-zinc-600 lg:text-left lg:text-base">
                      Your ID updates the QR as you type — show it at a kiosk or keep
                      editing until it matches your ticket.
                    </p>
                    <label className="mt-6 block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Ticket ID
                      </span>
                      <input
                        value={ticketInput}
                        onChange={(e) => setTicketInput(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-3.5 text-base font-medium text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] outline-none ring-orange-500/0 transition focus:border-orange-300 focus:ring-4 focus:ring-orange-500/20 lg:py-4"
                        placeholder="e.g. SEY-10492"
                        autoComplete="off"
                      />
                    </label>
                    {lookupError ? (
                      <p className="mt-4 text-sm text-rose-600" role="alert">
                        {lookupError}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={lookupLoading || !ticketInput.trim()}
                      onClick={() => void runLookup(ticketInput.trim())}
                      className="mt-6 w-full rounded-xl bg-linear-to-b from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_18px_-4px_rgba(234,88,12,0.55)] transition hover:from-orange-400 hover:to-orange-500 active:scale-[0.99] disabled:opacity-45 disabled:active:scale-100 lg:max-w-xs lg:py-4"
                    >
                      {lookupLoading ? 'Loading…' : 'Continue'}
                    </button>
                  </div>
                  <div className="mt-6 flex flex-col items-center lg:mt-0 lg:items-stretch lg:justify-center">
                    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] lg:p-6">
                      {ticketInput.trim() ? (
                        <QRCode
                          value={ticketInput.trim()}
                          size={200}
                          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                          viewBox="0 0 256 256"
                        />
                      ) : (
                        <div
                          className="flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-zinc-100 text-center text-sm text-zinc-500 lg:h-[220px] lg:w-full lg:max-w-[280px]"
                          aria-hidden
                        >
                          QR appears when you type
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {homeTab === 'history' ? (
              <div className="h-full min-h-0 overflow-y-auto overscroll-contain pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-10 lg:pb-10 lg:pt-8">
                <div className="mx-auto w-full max-w-md px-4 pb-24 lg:max-w-none lg:px-0 lg:pb-0">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-600/90 lg:text-left">
                    On this device
                  </p>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:mt-2">
                    <h1 className="text-xl font-bold tracking-tight text-zinc-950 lg:text-2xl">
                      History
                    </h1>
                    {historyItems.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          clearPayTransactions()
                          setHistoryTick((t) => t + 1)
                        }}
                        className="shrink-0 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                      >
                        Clear all
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 lg:text-base">
                    Last 10 payments stored locally in this browser.
                  </p>
                  {historyItems.length === 0 ? (
                    <p className="mt-10 text-center text-sm text-zinc-500 lg:mt-14 lg:text-base">
                      No payments yet. Complete a payment to see it here.
                    </p>
                  ) : (
                    <ul className="mt-5 grid gap-2 lg:mt-8 lg:grid-cols-2 lg:gap-4">
                      {historyItems.map((h) => (
                        <li
                          key={h.id}
                          className="rounded-xl border border-zinc-200/90 bg-white px-3 py-3 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-mono text-sm font-semibold text-zinc-950">
                              {h.ticketId}
                            </p>
                            <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-900">
                              {formatMoney(h.amount, h.currency)}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatDateTime(h.paidAt)} ·{' '}
                            <span className="capitalize">{h.payMethod}</span>
                          </p>
                          <p className="mt-1 truncate font-mono text-[11px] text-zinc-400">
                            {h.paymentRef}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
            <nav
              className="pointer-events-auto flex w-full max-w-[260px] gap-0.5 rounded-full border border-white/12 bg-zinc-950/65 p-0.5 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.65)] backdrop-blur-xl"
              role="tablist"
              aria-label="Pay views"
            >
              <button
                type="button"
                role="tab"
                aria-selected={homeTab === 'scan'}
                onClick={() => setHomeTab('scan')}
                className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-px rounded-full px-1.5 py-1.5 text-[10px] font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
                  homeTab === 'scan'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={homeTab === 'scan' ? 2 : 1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 0 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.177 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039l-.219.032a48.774 48.774 0 0 0-5.232 0l-.219-.032a2.192 2.192 0 0 0-1.736 1.039l-.821 1.316a2.31 2.31 0 0 1-1.64 1.055c-.38.054-.757.112-1.134.175C3.07 7.23 2.25 8.157 2.25 9.574V18c0 1.243 1.007 2.25 2.25 2.25h15c1.243 0 2.25-1.007 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.86 47.86 0 0 0-1.134-.177 2.31 2.31 0 0 1-1.64-1.055L15.15 4.77a2.192 2.192 0 0 0-1.736-1.039l-.219.032a48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316a2.31 2.31 0 0 1-1.64 1.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                  />
                </svg>
                Scan
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={homeTab === 'ticket'}
                onClick={() => setHomeTab('ticket')}
                className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-px rounded-full px-1.5 py-1.5 text-[10px] font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
                  homeTab === 'ticket'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={homeTab === 'ticket' ? 2 : 1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6M7 4h10a1 1 0 0 1 1 1v14l-4-2-4 2-4-2V5a1 1 0 0 1 1-1Z"
                  />
                </svg>
                Ticket
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={homeTab === 'history'}
                onClick={() => setHomeTab('history')}
                className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-px rounded-full px-1.5 py-1.5 text-[10px] font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
                  homeTab === 'history'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={homeTab === 'history' ? 2 : 1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l2.5 2.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
                  />
                </svg>
                History
              </button>
            </nav>
          </div>
        </div>
      ) : null}

      {step >= 1 ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-[min(680px,calc(100dvh-5rem))]">
          <header className="shrink-0 border-b border-zinc-200/90 bg-linear-to-r from-white to-zinc-50/90 px-4 py-4 shadow-sm lg:px-10 lg:py-5">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
              <SeymourLogo className="scale-95 lg:scale-100" />
            </div>
          </header>

          <main className="mx-auto flex w-full min-h-0 max-w-4xl flex-1 flex-col px-3 py-4 lg:px-10 lg:py-8">
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)] ring-1 ring-zinc-950/5">
              <div
                className="flex min-h-0 flex-1 w-full transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none"
                style={{
                  width: `${CAROUSEL_STEPS * 100}%`,
                  transform: `translate3d(-${(carouselIndex * 100) / CAROUSEL_STEPS}%, 0, 0)`,
                }}
              >
                <section
                  style={slidePanelStyle}
                  className="flex flex-col border-r border-zinc-100/80 p-5 sm:p-7"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-700/90">
                    Ticket
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950">
                    Your parking details
                  </h2>
                  {!ticket ? (
                    <p className="mt-4 text-sm text-zinc-500">No ticket loaded.</p>
                  ) : (
                <>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3 border-b border-zinc-100 pb-2">
                      <dt className="text-zinc-500">Ticket ID</dt>
                      <dd className="font-mono font-semibold text-zinc-950">
                        {ticket.ticketId}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-b border-zinc-100 pb-2">
                      <dt className="text-zinc-500">Vehicle</dt>
                      <dd className="font-medium text-zinc-900">{ticket.vehicleClass}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-b border-zinc-100 pb-2">
                      <dt className="text-zinc-500">Zone</dt>
                      <dd className="text-right font-medium text-zinc-900">
                        {ticket.entryZone}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-b border-zinc-100 pb-2">
                      <dt className="text-zinc-500">Entry</dt>
                      <dd className="text-right tabular-nums text-zinc-900">
                        {formatDateTime(ticket.entryTime)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-b border-zinc-100 pb-2">
                      <dt className="text-zinc-500">Time parked</dt>
                      <dd className="font-medium text-zinc-900">
                        {ticket.durationParked}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 pt-1">
                      <dt className="text-zinc-500">Amount due</dt>
                      <dd className="text-lg font-bold tabular-nums text-zinc-950">
                        {formatMoney(ticket.amountDue)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(0)
                        setHomeTab('scan')
                      }}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goMethodStep}
                      className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600"
                    >
                      Next — Pay
                    </button>
                  </div>
                </>
              )}
            </section>

            <section
              style={slidePanelStyle}
              className="flex flex-col border-r border-zinc-100/80 p-4 sm:p-6"
            >
              <h2 className="text-lg font-bold text-zinc-950">Payment method</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Choose how you want to pay. Processing is provided in partnership
                with Fidelity Bank Plc.
              </p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition ${
                    payMethod === 'card'
                      ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/25'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <p className="font-bold text-zinc-950">Card</p>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    Pay with debit or credit card details (demo — simulated).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('transfer')}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition ${
                    payMethod === 'transfer'
                      ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/25'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <p className="font-bold text-zinc-950">Bank transfer</p>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    Transfer to your dedicated virtual account (demo).
                  </p>
                </button>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!payMethod}
                  onClick={goTermsStep}
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </section>

            <section
              style={slidePanelStyle}
              className="flex flex-col border-r border-zinc-100/80 p-4 sm:p-6"
            >
              <h2 className="text-lg font-bold text-zinc-950">Terms</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Confirm that you agree before continuing to payment.
              </p>
              {payMethod === 'transfer' ? (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
                  <p className="font-semibold text-zinc-900">Virtual account (demo)</p>
                  <p className="mt-2 font-mono text-base font-bold text-zinc-950">
                    4012345678
                  </p>
                  <p className="mt-1 text-zinc-600">
                    Fidelity Bank Plc · Seymour Aviation Ltd.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Use this account for this ticket only. Reference:{' '}
                    <span className="font-mono font-medium text-zinc-700">
                      {ticket?.ticketId ?? '—'}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700">
                  Card entry is simulated on this demo. No real card data is collected.
                </div>
              )}
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500/30"
                />
                <span className="text-sm leading-snug text-zinc-700">
                  I agree to the{' '}
                  <span className="font-semibold text-zinc-900">
                    terms and conditions
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-zinc-900">
                    Seymour Aviation Ltd.
                  </span>{' '}
                  and{' '}
                  <span className="font-semibold text-zinc-900">
                    Fidelity Bank Plc
                  </span>{' '}
                  for this payment.
                </span>
              </label>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!termsAccepted}
                  onClick={() => void runPaySimulation()}
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600 disabled:opacity-45"
                >
                  Pay now
                </button>
              </div>
            </section>

            <section
              style={slidePanelStyle}
              className="flex flex-col items-center justify-center border-r border-zinc-100/80 p-6"
            >
              <div
                className="h-12 w-12 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600"
                aria-hidden
              />
              <p className="mt-6 text-center font-semibold text-zinc-900">
                {payProcessing ? 'Processing payment…' : 'Preparing…'}
              </p>
              <p className="mt-1 text-center text-sm text-zinc-500">
                Please wait — do not close this page.
              </p>
            </section>

            <section
              style={slidePanelStyle}
              className={`flex flex-col p-4 sm:p-6 ${
                exitExpired ? 'bg-rose-50' : 'bg-emerald-50/40'
              }`}
            >
              <h2
                className={`text-lg font-bold ${
                  exitExpired ? 'text-rose-900' : 'text-emerald-950'
                }`}
              >
                {exitExpired ? 'Exit window ended' : 'Payment successful'}
              </h2>
              {!ticket || !paymentRef || !paidAt ? null : (
                <>
                  <div
                    className={`mt-4 space-y-2 rounded-xl border p-4 text-sm ${
                      exitExpired
                        ? 'border-rose-200 bg-white text-rose-950'
                        : 'border-emerald-200/90 bg-white text-zinc-900'
                    }`}
                  >
                    <p>
                      <span className="text-zinc-500">Ticket</span>{' '}
                      <span className="font-mono font-semibold">{ticket.ticketId}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500">Paid</span>{' '}
                      <span className="font-semibold tabular-nums">
                        {formatMoney(ticket.amountDue)}
                      </span>
                    </p>
                    <p>
                      <span className="text-zinc-500">Method</span>{' '}
                      <span className="font-medium capitalize">{payMethod}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500">Reference</span>{' '}
                      <span className="font-mono text-xs font-semibold">{paymentRef}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500">Time</span>{' '}
                      <span className="tabular-nums">{formatDateTime(paidAt)}</span>
                    </p>
                  </div>
                  {!exitExpired ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4">
                      <p className="text-sm font-bold text-amber-950">
                        {EXIT_WINDOW_COPY}
                      </p>
                      {exitRemainingMs != null ? (
                        <p className="mt-2 text-lg font-bold tabular-nums text-amber-900">
                          Time left to exit: {formatRemaining(exitRemainingMs)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-100/80 p-4">
                      <p className="text-sm font-semibold text-rose-950">
                        The complimentary exit period has ended. Additional charges may
                        now apply. If you still need to complete payment, choose a
                        payment method again.
                      </p>
                      <button
                        type="button"
                        onClick={restartPaymentMethod}
                        className="mt-4 w-full rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-rose-800"
                      >
                        Choose payment method
                      </button>
                    </div>
                  )}
                  {!exitExpired ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStep(0)
                        setHomeTab('scan')
                        setTicket(null)
                        setTicketInput('')
                        setSearchParams({}, { replace: true })
                        setPaymentRef(null)
                        setPaidAt(null)
                        setExitDeadline(null)
                        setExitExpired(false)
                      }}
                      className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                    >
                      Pay another ticket
                    </button>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
        </div>
      ) : null}
      </div>

      {reminderOpen && !exitExpired && step === 5 ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={reminderTitleId}
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <h3 id={reminderTitleId} className="text-lg font-bold text-zinc-950">
              Exit reminder
            </h3>
            <p className="mt-2 text-sm text-zinc-600">{reminderBody}</p>
            <p className="mt-3 text-xs font-medium text-amber-900">{EXIT_WINDOW_COPY}</p>
            <button
              type="button"
              onClick={() => setReminderOpen(false)}
              className="mt-5 w-full rounded-xl bg-zinc-950 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
