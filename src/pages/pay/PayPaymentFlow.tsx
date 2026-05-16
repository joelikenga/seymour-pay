import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PayExitTimerSheet from '../../components/pay/PayExitTimerSheet'
import PayPaymentReceipt from '../../components/pay/PayPaymentReceipt'
import SeymourLogo from '../../components/SeymourLogo'
import { appendPayTransaction } from '../../lib/payTransactionHistory'
import type { PayMethod } from '../../types/ticketPay'
import {
  EXIT_REMINDER_MS,
  EXIT_SHEET_DELAY_MS,
  EXIT_WINDOW_MS,
  paymentSlidePanelStyle,
  PAYMENT_CAROUSEL_STEPS,
} from './payFlowShared'
import { payBtnAccent, payBtnGhost, payBtnPrimary, payBtnSecondary } from './payUi'
import { usePayTicketLookup } from './usePayTicketLookup'

type PayPaymentFlowProps = {
  ticketId: string
  onBackToDetails: () => void
}

export default function PayPaymentFlow({
  ticketId,
  onBackToDetails,
}: PayPaymentFlowProps) {
  const navigate = useNavigate()
  const { ticket, error, loading } = usePayTicketLookup(ticketId)

  const [step, setStep] = useState(2)
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [payProcessing, setPayProcessing] = useState(false)
  const [paymentRef, setPaymentRef] = useState<string | null>(null)
  const [paidAt, setPaidAt] = useState<string | null>(null)
  const [exitDeadline, setExitDeadline] = useState<number | null>(null)
  const [exitRemainingMs, setExitRemainingMs] = useState<number | null>(null)
  const [exitExpired, setExitExpired] = useState(false)
  const [exitSheetOpen, setExitSheetOpen] = useState(false)

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
    if (step !== 5 || exitExpired || exitDeadline == null) {
      setExitSheetOpen(false)
      return
    }
    setExitSheetOpen(false)
    const openId = window.setTimeout(() => {
      setExitSheetOpen(true)
    }, EXIT_SHEET_DELAY_MS)
    return () => window.clearTimeout(openId)
  }, [step, exitExpired, exitDeadline])

  useEffect(() => {
    if (step !== 5 || exitExpired || exitDeadline == null) return
    const id = window.setInterval(() => {
      const left = exitDeadline - Date.now()
      if (left <= 0) return
      setExitSheetOpen(true)
    }, EXIT_REMINDER_MS)
    return () => window.clearInterval(id)
  }, [step, exitExpired, exitDeadline])

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
    setExitSheetOpen(false)
    setStep(2)
  }

  const payAnother = useCallback(() => {
    navigate('/pay', { replace: true })
  }, [navigate])

  const carouselIndex = step - 2
  const showReceipt =
    step === 5 && Boolean(paymentRef && paidAt && payMethod && ticket)

  if (loading) {
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
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <p className="text-sm text-rose-600" role="alert">
          {error instanceof Error ? error.message : 'Could not load ticket.'}
        </p>
        <button type="button" onClick={onBackToDetails} className={`mt-6 ${payBtnPrimary}`}>
          Back to ticket
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="absolute inset-0 flex min-h-0 min-w-0 flex-col bg-zinc-100 lg:min-h-[min(680px,calc(100dvh-5rem))]">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 lg:px-8 lg:py-4">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
            <SeymourLogo className="scale-95 lg:scale-100" />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {showReceipt ? (
            <div className="client-touch-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              <PayPaymentReceipt
                ticket={ticket}
                paymentRef={paymentRef!}
                paidAt={paidAt!}
                payMethod={payMethod!}
                exitExpired={exitExpired}
                onViewExitTimer={() => setExitSheetOpen(true)}
                actions={
                  exitExpired ? (
                    <button
                      type="button"
                      onClick={restartPaymentMethod}
                      className={payBtnPrimary}
                    >
                      Choose payment method
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={payAnother}
                      className={payBtnSecondary}
                    >
                      Pay another ticket
                    </button>
                  )
                }
              />
            </div>
          ) : (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-100 py-4">
            <div
              className="flex min-h-0 flex-1 w-full transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none"
              style={{
                width: `${PAYMENT_CAROUSEL_STEPS * 100}%`,
                transform: `translate3d(-${(carouselIndex * 100) / PAYMENT_CAROUSEL_STEPS}%, 0, 0)`,
              }}
            >
              <section
                style={paymentSlidePanelStyle}
                className="flex flex-col border-r border-zinc-100 bg-white p-4 sm:p-6"
              >
                <h2 className="text-base font-semibold text-zinc-900">Payment method</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Choose how you want to pay. Processing is provided in partnership
                  with Fidelity Bank Plc.
                </p>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod('card')}
                    className={`rounded-lg border px-4 py-3.5 text-left transition ${
                      payMethod === 'card'
                        ? 'border-zinc-800 bg-zinc-50'
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
                    className={`rounded-lg border px-4 py-3.5 text-left transition ${
                      payMethod === 'transfer'
                        ? 'border-zinc-800 bg-zinc-50'
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
                  <button type="button" onClick={onBackToDetails} className={payBtnGhost}>
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!payMethod}
                    onClick={goTermsStep}
                    className={payBtnAccent}
                  >
                    Next
                  </button>
                </div>
              </section>

              <section
                style={paymentSlidePanelStyle}
                className="flex flex-col border-r border-zinc-100 bg-white p-4 sm:p-6"
              >
                <h2 className="text-base font-semibold text-zinc-900">Terms</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Confirm that you agree before continuing to payment.
                </p>
                {payMethod === 'transfer' ? (
                  <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
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
                  <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700">
                    Card entry is simulated on this demo. No real card data is collected.
                  </div>
                )}
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
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
                  <button type="button" onClick={() => setStep(2)} className={payBtnGhost}>
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!termsAccepted}
                    onClick={() => void runPaySimulation()}
                    className={payBtnAccent}
                  >
                    Pay now
                  </button>
                </div>
              </section>

              <section
                style={paymentSlidePanelStyle}
                className="flex flex-col items-center justify-center border-r border-zinc-100 bg-white p-6"
              >
                <div
                  className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700"
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
                style={paymentSlidePanelStyle}
                className="flex flex-col bg-zinc-100"
                aria-hidden
              />
            </div>
          </div>
          )}
        </main>
      </div>

      <PayExitTimerSheet
        open={exitSheetOpen && step === 5}
        onClose={() => setExitSheetOpen(false)}
        remainingMs={exitRemainingMs}
        expired={exitExpired}
      />
    </>
  )
}
