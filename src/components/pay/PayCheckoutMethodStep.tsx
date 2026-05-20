import type { ReactNode } from 'react'
import fidelityLogo from '../../assets/Fidelity_Bank_Plc_Main_Logo.svg'
import { payBtnAccent, payBtnGhost } from '../../pages/pay/payUi'
import type { PayMethod } from '../../types/ticketPay'

type PayCheckoutMethodStepProps = {
  amountLabel: string
  payMethod: PayMethod | null
  onBack: () => void
  onContinue: () => void
  children: ReactNode
}

export default function PayCheckoutMethodStep({
  amountLabel,
  payMethod,
  onBack,
  onContinue,
  children,
}: PayCheckoutMethodStepProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white max-lg:border-0 max-lg:bg-transparent lg:rounded-xl lg:border lg:border-zinc-200 lg:bg-white">
      <div className="flex items-start justify-between gap-6 border-b border-zinc-100 px-5 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">Step 1 of 3</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
            Payment method
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
        <p className="text-sm text-zinc-600">How would you like to pay?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">{children}</div>
        <p className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500">
          <span>Payments processed by</span>
          <img
            src={fidelityLogo}
            alt="Fidelity Bank"
            className="h-4 w-auto max-w-18 object-contain object-left"
          />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-5 py-4 sm:px-6">
        <button type="button" onClick={onBack} className={payBtnGhost}>
          Back
        </button>
        <button
          type="button"
          disabled={!payMethod}
          onClick={onContinue}
          className={payBtnAccent}
        >
          Continue
        </button>
      </div>
    </article>
  )
}
