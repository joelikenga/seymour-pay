import type { ReactNode } from 'react'
import { payBtnAccent, payBtnGhost } from '../../pages/pay/payUi'

type PayCheckoutConfirmStepProps = {
  title: string
  amountLabel: string
  payButtonLabel: string
  canPay: boolean
  termsAccepted: boolean
  onTermsChange: (accepted: boolean) => void
  onBack: () => void
  onPay: () => void
  children: ReactNode
}

export default function PayCheckoutConfirmStep({
  title,
  amountLabel,
  payButtonLabel,
  canPay,
  termsAccepted,
  onTermsChange,
  onBack,
  onPay,
  children,
}: PayCheckoutConfirmStepProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white max-lg:border-0 max-lg:bg-transparent lg:rounded-xl lg:border lg:border-zinc-200 lg:bg-white">
      <div className="flex items-start justify-between gap-6 border-b border-zinc-100 px-5 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">Step 2 of 3</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
            {title}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-zinc-500">Amount due</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-950 sm:text-2xl">
            {amountLabel}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {children}

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 sm:mt-6">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-orange-600 focus:ring-orange-500/30"
          />
          <span className="text-sm leading-relaxed text-zinc-600">
            I agree to the terms and conditions of{' '}
            <span className="font-medium text-zinc-900">Seymour Aviation Ltd.</span> and{' '}
            <span className="font-medium text-zinc-900">Fidelity Bank Plc</span>.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className={`${payBtnGhost} order-2 w-full sm:order-1 sm:w-auto sm:shrink-0`}
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canPay}
          onClick={onPay}
          className={`${payBtnAccent} order-1 w-full sm:order-2 sm:min-w-[12rem] sm:flex-1 sm:w-auto`}
        >
          {payButtonLabel}
        </button>
      </div>
    </article>
  )
}
