import { useEffect, useMemo, useState, type FormEvent } from 'react'
import DropdownSelect from './DropdownSelect'
import {
  channelLabel,
  channelPillClass,
  PAYMENT_CHANNELS,
} from '../../lib/channelStyles'
import { formatMoney } from '../../lib/formatters'
import { statusPillClass } from '../../lib/statusStyles'
import { vehicleLabel, VEHICLE_TYPES } from '../../lib/vehicleStyles'
import type {
  PaymentChannel,
  Transaction,
  VehicleType,
} from '../../types/transaction'

const STATUS_LABEL: Record<Transaction['status'], string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  reconciled: 'Reconciled',
}

interface EditTransactionModalProps {
  tx: Transaction | null
  open: boolean
  onClose: () => void
  onSave: (id: string, patch: Partial<Transaction>) => void
}

const FIELD_BASE =
  'mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary/15'
const LABEL_BASE =
  'text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500'

export default function EditTransactionModal({
  tx,
  open,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [channel, setChannel] = useState<PaymentChannel>('transfer')
  const [vehicleType, setVehicleType] = useState<VehicleType>('car')

  useEffect(() => {
    if (!tx) return
    setReference(tx.reference)
    setAmount(String(tx.amount))
    setChannel(tx.channel)
    setVehicleType(tx.vehicleType)
  }, [tx])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const vehicleOptions = useMemo(
    () =>
      VEHICLE_TYPES.map((v) => ({ value: v, label: vehicleLabel[v] })),
    [],
  )
  const channelOptions = useMemo(
    () =>
      PAYMENT_CHANNELS.map((c) => ({ value: c, label: channelLabel[c] })),
    [],
  )
  const livePreviewAmount = useMemo(() => {
    const n = Number(amount.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }, [amount])

  if (!open || !tx) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!Number.isFinite(livePreviewAmount)) return
    onSave(tx.id, {
      amount: livePreviewAmount,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/55 backdrop-blur-[3px] transition"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tx-title"
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-zinc-200/90 bg-white shadow-[0_40px_120px_-30px_rgba(15,23,42,0.45)] ring-1 ring-zinc-950/5"
      >
        {/* Hero strip */}
        <div className="relative overflow-hidden border-b border-zinc-100 bg-linear-to-br from-orange-50/95 via-white to-amber-50/60 px-6 pt-5 pb-6 sm:px-7">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-300/25 blur-3xl"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-orange-200/60 to-transparent" aria-hidden />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700/90">
                Edit transaction
              </p>
              <h2
                id="edit-tx-title"
                className="mt-1.5 truncate font-mono text-lg font-bold text-zinc-950 sm:text-xl"
                title={tx.reference}
              >
                {tx.reference}
              </h2>
              <p className="mt-1 truncate text-[13px] text-zinc-600">
                ID {tx.id}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-transparent bg-white/70 p-2 text-zinc-500 shadow-sm backdrop-blur transition hover:border-zinc-200 hover:bg-white hover:text-zinc-900"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusPillClass[tx.status]}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {STATUS_LABEL[tx.status]}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${channelPillClass[tx.channel]}`}
            >
              {channelLabel[tx.channel]}
            </span>
            <span className="ml-auto text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Amount
              </span>
              <span className="block text-base font-bold tabular-nums text-zinc-950">
                {formatMoney(livePreviewAmount)}
              </span>
            </span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 sm:px-7">
            {/* Identity */}
            <fieldset className="space-y-4">
              <legend className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                Identity
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={LABEL_BASE}>Ticket ID</span>
                  <input
                    value={reference}
                    disabled
                    readOnly
                    className={`${FIELD_BASE} font-mono`}
                  />
                </label>
              </div>
              <label className="block">
                <span className={LABEL_BASE}>Amount (₦)</span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${FIELD_BASE} tabular-nums`}
                  required
                />
              </label>
            </fieldset>

            <div className="h-px bg-linear-to-r from-transparent via-zinc-200 to-transparent" />

            {/* Vehicle & payment */}
            <fieldset className="space-y-4">
              <legend className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                Vehicle &amp; payment
              </legend>
              <DropdownSelect<VehicleType>
                label="Vehicle type"
                value={vehicleType}
                options={vehicleOptions}
                onChange={() => {}}
                disabled
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <DropdownSelect<PaymentChannel>
                  label="Payment type"
                  value={channel}
                  options={channelOptions}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </fieldset>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4 sm:px-7">
            <p className="hidden text-[11px] text-zinc-500 sm:block">
              Press <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">Esc</kbd> to cancel
            </p>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12.5l4.5 4.5L19 6.5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Save changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
