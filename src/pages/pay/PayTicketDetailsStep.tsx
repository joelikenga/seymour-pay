import PayTicketDetailsCard from '../../components/pay/PayTicketDetailsCard'
import { PayReceiptRoot } from '../../components/pay/PayReceipt'
import SeymourLogo from '../../components/SeymourLogo'
import { isPayTicketNotFoundError } from '../../utils/api/services/ticketPayApi'
import { payBtnPrimary, payBtnSecondary } from './payUi'
import { usePayTicketLookup } from './usePayTicketLookup'

type PayTicketDetailsStepProps = {
  ticketId: string
  onBack: () => void
  onContinueToPay: () => void
  backLabel?: string
}

function PayDetailsLoading() {
  return (
    <PayReceiptRoot className="animate-pulse border-x-0 sm:border-x">
      <div className="border-b border-dashed border-zinc-200 px-5 py-5">
        <div className="mx-auto h-3 w-32 rounded bg-zinc-200" />
      </div>
      <div className="space-y-0 px-5 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-zinc-100 py-3">
            <div className="h-3 w-full rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </PayReceiptRoot>
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
    <PayReceiptRoot className="border-x-0 sm:border-x">
      <div className="px-5 py-8 text-center" role="alert">
        <p className="text-[15px] font-semibold text-zinc-900">Ticket not found</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{message}</p>
        <p className="mt-3 font-mono text-xs text-zinc-400">{ticketId}</p>
        <button type="button" onClick={onBack} className={`mt-6 ${payBtnPrimary}`}>
          {backLabel}
        </button>
      </div>
    </PayReceiptRoot>
  )
}

export default function PayTicketDetailsStep({
  ticketId,
  onBack,
  onContinueToPay,
  backLabel = 'Scan another ticket',
}: PayTicketDetailsStepProps) {
  const { ticket, error, loading } = usePayTicketLookup(ticketId)

  const errorMessage =
    error && isPayTicketNotFoundError(error)
      ? 'No parking ticket matches this ID. Check the number and try again.'
      : error instanceof Error
        ? error.message
        : 'Could not load ticket. Please try again.'

  return (
    <div className="absolute inset-0 flex min-h-0 flex-col bg-zinc-100">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex justify-center">
          <SeymourLogo className="scale-90" />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
        <div className="w-full">
          {loading ? <PayDetailsLoading /> : null}

          {!loading && ticket ? (
            <PayTicketDetailsCard ticket={ticket}>
              <button type="button" onClick={onContinueToPay} className={payBtnPrimary}>
                Continue to pay
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
      </main>
    </div>
  )
}
