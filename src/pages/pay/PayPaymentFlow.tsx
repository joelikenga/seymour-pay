import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PayCheckoutConfirmStep from '../../components/pay/PayCheckoutConfirmStep'
import PayCheckoutMethodStep from '../../components/pay/PayCheckoutMethodStep'
import PayExitTimerSheet from '../../components/pay/PayExitTimerSheet'
import PayCardForm, {
  isPayCardDetailsComplete,
  type PayCardDetails,
} from '../../components/pay/PayCardForm'
import PayMethodOption, {
  PayCardIcon,
  PayTransferIcon,
} from '../../components/pay/PayMethodOption'
import PayPaymentReceipt from '../../components/pay/PayPaymentReceipt'
import PayTransferWaitSheet, {
  useTransferWaitCountdown,
} from '../../components/pay/PayTransferWaitSheet'
import PayVirtualAccountCard from '../../components/pay/PayVirtualAccountCard'
import { formatMoney } from '../../lib/formatters'
import { appendPayTransaction } from '../../lib/payTransactionHistory'
import type { PayMethod } from '../../types/ticketPay'
import {
  EXIT_REMINDER_MS,
  EXIT_SHEET_DELAY_MS,
  EXIT_WINDOW_MS,
  paymentSlidePanelStyle,
  PAYMENT_CAROUSEL_STEPS,
  PAY_PAGE_INNER,
  PAY_PAGE_MAIN,
  PAY_MOBILE_NAV_CLEARANCE,
  payExtraTicketUrl,
} from './payFlowShared'
import {
  payBtnPrimary,
  payBtnSecondary,
  payFlowPanel,
} from './payUi'
import { usePayTicketLookup } from './usePayTicketLookup'

type PayPaymentFlowProps = {
  ticketId: string
  extraPay?: boolean
  onBackToDetails: () => void
}

const emptyCardDetails: PayCardDetails = {
  number: '',
  expiry: '',
  cvv: '',
  name: '',
}

export default function PayPaymentFlow({
  ticketId,
  extraPay = false,
  onBackToDetails,
}: PayPaymentFlowProps) {
  const navigate = useNavigate()
  const { ticket, error, loading } = usePayTicketLookup(ticketId, extraPay)

  const [step, setStep] = useState(2)
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null)
  const [cardDetails, setCardDetails] = useState<PayCardDetails>(emptyCardDetails)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [payProcessing, setPayProcessing] = useState(false)
  const [paymentRef, setPaymentRef] = useState<string | null>(null)
  const [paidAt, setPaidAt] = useState<string | null>(null)
  const [exitDeadline, setExitDeadline] = useState<number | null>(null)
  const [exitRemainingMs, setExitRemainingMs] = useState<number | null>(null)
  const [exitExpired, setExitExpired] = useState(false)
  const [exitSheetOpen, setExitSheetOpen] = useState(false)
  const [transferWaitOpen, setTransferWaitOpen] = useState(false)
  const transferWaitRemainingMs = useTransferWaitCountdown(transferWaitOpen)

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
    setCardDetails(emptyCardDetails)
    setStep(3)
  }

  const completePayment = useCallback(() => {
    if (!ticket || !payMethod) return
    const ref = `PAY-${Date.now().toString(36).toUpperCase()}`
    const paidAtIso = new Date().toISOString()
    setPaymentRef(ref)
    setPaidAt(paidAtIso)
    setPayProcessing(false)
    setTransferWaitOpen(false)
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
      duration: ticket.durationParked,
    })
    setStep(5)
  }, [ticket, payMethod])

  const runPaySimulation = async () => {
    if (!ticket || !payMethod || !termsAccepted) return
    if (payMethod === 'transfer') {
      setTransferWaitOpen(true)
      return
    }
    setStep(4)
    setPayProcessing(true)
    await new Promise((r) => setTimeout(r, 2200))
    completePayment()
  }

  const payAnother = useCallback(() => {
    navigate('/pay', { replace: true })
  }, [navigate])

  const goPayExtra = useCallback(() => {
    if (!ticket) return
    navigate(payExtraTicketUrl(ticket.ticketId))
  }, [navigate, ticket])

  const carouselIndex = step - 2
  const showReceipt =
    step === 5 && Boolean(paymentRef && paidAt && payMethod && ticket)

  if (loading) {
    return (
      <div className={`${PAY_PAGE_MAIN} items-center justify-center`}>
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
      <div className={`${PAY_PAGE_MAIN} items-center justify-center p-6 text-center`}>
        <p className="text-sm text-rose-600" role="alert">
          {error instanceof Error ? error.message : 'Could not load ticket.'}
        </p>
        <button type="button" onClick={onBackToDetails} className={`mt-6 ${payBtnPrimary}`}>
          Back to ticket
        </button>
      </div>
    )
  }

  const amountLabel = formatMoney(ticket.amountDue, ticket.currency)
  const cardReady = isPayCardDetailsComplete(cardDetails)
  const canPay =
    termsAccepted &&
    (payMethod === 'transfer' || (payMethod === 'card' && cardReady))

  return (
    <>
      <div className={`${PAY_PAGE_MAIN} ${PAY_MOBILE_NAV_CLEARANCE}`}>
        <div className={`${PAY_PAGE_INNER} lg:max-w-2xl`}>
          {showReceipt ? (
            <PayPaymentReceipt
              ticket={ticket}
              paymentRef={paymentRef!}
              paidAt={paidAt!}
              payMethod={payMethod!}
              exitExpired={exitExpired}
              onViewExitTimer={() => setExitSheetOpen(true)}
              onPayExtra={goPayExtra}
              actions={
                exitExpired ? null : (
                  <button type="button" onClick={payAnother} className={payBtnSecondary}>
                    Pay another ticket
                  </button>
                )
              }
            />
          ) : (
            <div className="relative overflow-x-hidden">
              <div
                className="flex w-full transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none"
                style={{
                  width: `${PAYMENT_CAROUSEL_STEPS * 100}%`,
                  transform: `translate3d(-${(carouselIndex * 100) / PAYMENT_CAROUSEL_STEPS}%, 0, 0)`,
                }}
              >
                <section style={paymentSlidePanelStyle} className="flex flex-col">
                  <PayCheckoutMethodStep
                    amountLabel={amountLabel}
                    payMethod={payMethod}
                    onBack={onBackToDetails}
                    onContinue={goTermsStep}
                  >
                    <PayMethodOption
                      method="card"
                      selected={payMethod === 'card'}
                      title="Card"
                      description="Debit or credit card"
                      icon={<PayCardIcon />}
                      onSelect={() => setPayMethod('card')}
                    />
                    <PayMethodOption
                      method="transfer"
                      selected={payMethod === 'transfer'}
                      title="Bank transfer"
                      description="Virtual account"
                      icon={<PayTransferIcon />}
                      onSelect={() => setPayMethod('transfer')}
                    />
                  </PayCheckoutMethodStep>
                </section>

                <section style={paymentSlidePanelStyle} className="flex flex-col">
                  <PayCheckoutConfirmStep
                    title={payMethod === 'transfer' ? 'Transfer details' : 'Card payment'}
                    amountLabel={amountLabel}
                    payButtonLabel={
                      payMethod === 'transfer' ? 'I have transferred' : `Pay ${amountLabel}`
                    }
                    canPay={canPay}
                    termsAccepted={termsAccepted}
                    onTermsChange={setTermsAccepted}
                    onBack={() => setStep(2)}
                    onPay={() => void runPaySimulation()}
                  >
                    {payMethod === 'transfer' ? (
                      <PayVirtualAccountCard />
                    ) : (
                      <PayCardForm value={cardDetails} onChange={setCardDetails} />
                    )}
                  </PayCheckoutConfirmStep>
                </section>

                <section
                  style={paymentSlidePanelStyle}
                  className="flex flex-col items-center justify-center px-4 py-8 sm:py-12"
                >
                  <div className={`${payFlowPanel} w-full max-w-md p-8 text-center sm:p-10`}>
                    <div
                      className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-orange-100 border-t-orange-600"
                      aria-hidden
                    />
                    <p className="mt-6 text-lg font-bold text-zinc-900">
                      {payProcessing ? 'Processing payment…' : 'Preparing…'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      Please wait. Do not close this page.
                    </p>
                  </div>
                </section>

                <section
                  style={paymentSlidePanelStyle}
                  className="flex flex-col bg-transparent"
                  aria-hidden
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <PayTransferWaitSheet
        open={transferWaitOpen}
        displayRemainingMs={transferWaitRemainingMs}
        onComplete={completePayment}
      />

      <PayExitTimerSheet
        open={exitSheetOpen && step === 5}
        onClose={() => setExitSheetOpen(false)}
        remainingMs={exitRemainingMs}
        expired={exitExpired}
      />
    </>
  )
}
