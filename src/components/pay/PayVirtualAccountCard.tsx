import CopyableValue from './CopyableValue'
import {
  PAY_DEMO_ACCOUNT_NAME,
  PAY_DEMO_BANK_NAME,
  PAY_DEMO_VIRTUAL_ACCOUNT,
} from '../../pages/pay/payFlowShared'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-zinc-900">{value}</span>
    </div>
  )
}

export default function PayVirtualAccountCard() {
  return (
    <div>
      <CopyableValue value={PAY_DEMO_VIRTUAL_ACCOUNT} />

      <div className="mt-4 border-t border-zinc-100 pt-1">
        <DetailRow label="Bank" value={PAY_DEMO_BANK_NAME} />
        <DetailRow label="Account name" value={PAY_DEMO_ACCOUNT_NAME} />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        Transfer the exact amount due to this account.
      </p>
    </div>
  )
}
