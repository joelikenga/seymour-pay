import PayTicketDetailsCard from '../../components/pay/PayTicketDetailsCard'
import { isPayTicketNotFoundError } from '../../utils/api/services/ticketPayApi'
import { PAY_PAGE_INNER, PAY_PAGE_MAIN, PAY_MOBILE_NAV_CLEARANCE } from './payFlowShared'
import { payBtnPrimary, payBtnSecondary } from './payUi'
import { usePayTicketLookup } from './usePayTicketLookup'

type PayTicketDetailsStepProps = {
  ticketId: string
  extraPay?: boolean
  onBack: () => void
  onContinueToPay: () => void
  backLabel?: string
}

function PayDetailsLoading() {
  return (
    <article className="mx-auto w-full max-w-lg animate-pulse overflow-hidden rounded-xl border border-zinc-200 bg-white sm:rounded-2xl">
      <div className="flex items-start gap-4 px-5 py-6 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-24 rounded bg-zinc-200" />
          <div className="mt-2 h-6 w-40 rounded bg-zinc-100" />
        </div>
        <div className="h-[96px] w-[96px] shrink-0 rounded-lg bg-zinc-100" />
      </div>
      <div className="space-y-3 border-t border-zinc-100 px-5 py-4 sm:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <div className="h-3 w-16 rounded bg-zinc-100" />
            <div className="h-3 w-24 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t border-zinc-200 px-5 py-4 sm:px-6">
        <div className="h-4 w-20 rounded bg-zinc-200" />
        <div className="h-6 w-24 rounded bg-zinc-200" />
      </div>
    </article>
  )
}

function PayDetailsError({
  ticketId,
  message,
  onBack,
  backLabel,
}: {
  ticketId: string
  message: string
  onBack: () => void
  backLabel: string
}) {
  return (
    <article className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white sm:rounded-2xl">
      <div className="px-5 py-10 text-center sm:px-6" role="alert">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-lg font-bold text-zinc-900">Ticket not found</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{message}</p>
        <p className="mt-3 font-mono text-xs text-zinc-400">{ticketId}</p>
        <button type="button" onClick={onBack} className={`mt-6 ${payBtnPrimary}`}>
          {backLabel}
        </button>
      </div>
    </article>
  )
}

export default function PayTicketDetailsStep({
  ticketId,
  extraPay = false,
  onBack,
  onContinueToPay,
  backLabel = 'Scan another ticket',
}: PayTicketDetailsStepProps) {
  const { ticket, error, loading } = usePayTicketLookup(ticketId, extraPay)

  const errorMessage =
    error && isPayTicketNotFoundError(error)
      ? 'No parking ticket matches this ID. Check the number and try again.'
      : error instanceof Error
        ? error.message
        : 'Could not load ticket. Please try again.'

  return (
    <div className={`${PAY_PAGE_MAIN} ${PAY_MOBILE_NAV_CLEARANCE}`}>
      <div className={PAY_PAGE_INNER}>
        {loading ? <PayDetailsLoading /> : null}

        {!loading && ticket ? (
          <PayTicketDetailsCard ticket={ticket}>
              <button type="button" onClick={onContinueToPay} className={payBtnPrimary}>
                {extraPay ? 'Continue to pay extra' : 'Continue to pay'}
              </button>
            <button type="button" onClick={onBack} className={payBtnSecondary}>
              {backLabel}
            </button>
          </PayTicketDetailsCard>
        ) : null}

        {!loading && !ticket && error ? (
          <PayDetailsError
            ticketId={ticketId}
            message={errorMessage}
            onBack={onBack}
            backLabel={backLabel}
          />
        ) : null}
      </div>
    </div>
  )
}
