import type { ReactNode } from 'react'
import type { PayMethod } from '../../types/ticketPay'

type PayMethodOptionProps = {
  method: PayMethod
  selected: boolean
  title: string
  description: string
  icon: ReactNode
  onSelect: () => void
}

export default function PayMethodOption({
  selected,
  title,
  description,
  icon,
  onSelect,
}: PayMethodOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex h-full flex-row items-start gap-3 rounded-xl border p-4 text-left transition sm:flex-col sm:gap-0 sm:p-5 ${
        selected
          ? 'border-orange-400 bg-orange-50/30 ring-2 ring-orange-500/15'
          : 'border-zinc-200 bg-white hover:border-zinc-300'
      }`}
    >
      <span
        className={`absolute right-4 top-4 flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${
          selected ? 'border-orange-600 bg-orange-600' : 'border-zinc-300 bg-white'
        }`}
        aria-hidden
      >
        {selected ? (
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        ) : null}
      </span>

      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
          selected ? 'bg-orange-600 text-white' : 'bg-zinc-100 text-zinc-600'
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1 pr-6 sm:mt-4">
        <span className="block text-sm font-semibold text-zinc-950">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-zinc-500">{description}</span>
      </span>
    </button>
  )
}

export function PayCardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PayTransferIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h12M12 4l4 3-4 3M20 17H8M8 20l-4-3 4-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
