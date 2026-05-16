import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import SeymourLogo from '../../components/SeymourLogo'
import { formatDateTime, formatMoney } from '../../lib/formatters'
import { appendPayTransaction } from '../../lib/payTransactionHistory'
import type { PayMethod, PayTicketDetails } from '../../types/ticketPay'
import { fetchPayTicketById } from '../../utils/api/services/ticketPayApi'
import {
  CAROUSEL_STEPS,
  EXIT_REMINDER_MS,
  EXIT_WINDOW_COPY,
  EXIT_WINDOW_MS,
  formatRemaining,
  isDesktopViewport,
  PAY_TICKET_ID_PARAM,
  slidePanelStyle,
} from './payFlowShared'

export default function PayCheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reminderTitleId = useId()
  const urlBootstrap = useRef(false)

  const [step, setStep] = useState(1)
  const [ticket, setTicket] = useState<PayTicketDetails | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingTicket, setLoadingTicket] = useState(true)

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

  const loadTicket = useCallback(async (rawId: string) => {
    setLoadingTicket(true)
    setLoadError(null)
    try {
      const details = await fetchPayTicketById(rawId)
      setTicket(details)
      setStep(1)
    } catch (e) {
      setTicket(null)
      setLoadError(e instanceof Error ? e.message : 'Could not load ticket.')
    } finally {
      setLoadingTicket(false)
    }
  }, [])

  useEffect(() => {
    const fromUrl = searchParams.get(PAY_TICKET_ID_PARAM)?.trim()
    if (!fromUrl) {
      setLoadingTicket(false)
      setLoadError('No ticket ID provided.')
      return
    }
    if (urlBootstrap.current) return
    urlBootstrap.current = true
    void loadTicket(fromUrl)
  }, [searchParams, loadTicket])

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

  const leaveCheckout = () => {
    navigate(isDesktopViewport() ? '/pay/ticket' : '/pay')
  }

  const payAnother = () => {
    navigate('/pay/ticket', { replace: true })
  }

  const carouselIndex = step - 1

  if (!loadingTicket && loadError && !ticket) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <p className="text-sm text-rose-600" role="alert">
          {loadError}
        </p>
        <Link
          to="/pay/ticket"
          className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
        >
          Enter ticket
        </Link>
      </div>
    )
  }

  if (loadingTicket && !ticket) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600"
          aria-hidden
        />
        <p className="mt-4 text-sm text-zinc-600">Loading ticket…</p>
      </div>
    )
  }

  if (!ticket) {
    return <Navigate to="/pay/ticket" replace />
  }

  return (
    <>
      <div className="absolute inset-0 flex min-h-0 min-w-0 flex-col lg:min-h-[min(680px,calc(100dvh-5rem))]">
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
                    onClick={leaveCheckout}
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
                        {ticket.ticketId}
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
                {paymentRef && paidAt ? (
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
                        onClick={payAnother}
                        className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Pay another ticket
                      </button>
                    ) : null}
                  </>
                ) : null}
              </section>
            </div>
          </div>
        </main>
      </div>

      {reminderOpen && !exitExpired && step === 5 ? (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-zinc-950/45 p-4 sm:items-center"
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
    </>
  )
}
