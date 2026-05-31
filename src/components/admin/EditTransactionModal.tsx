import { useEffect, useMemo, useState, type FormEvent } from 'react'
import DropdownSelect from './DropdownSelect'
import {
  channelLabel,
  channelPillClass,
  PAYMENT_CHANNELS,
} from '../../lib/channelStyles'
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminModalBackdrop,
  adminModalBody,
  adminModalCloseBtn,
  adminModalFooter,
  adminModalHeader,
  adminModalPanel,
  adminModalSubtitle,
  adminModalTitle,
} from '../../lib/adminModalStyles'
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
  'mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200'
const LABEL_BASE = 'text-xs font-medium text-zinc-600'

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className={adminModalBackdrop}
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tx-title"
        className={`${adminModalPanel} max-h-[92vh] max-w-lg flex flex-col`}
      >
        <div className={adminModalHeader}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="edit-tx-title" className={adminModalTitle}>
                Edit transaction
              </h2>
              <p className={`${adminModalSubtitle} truncate font-mono`} title={tx.reference}>
                {tx.reference}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={adminModalCloseBtn}
              aria-label="Close"
            >
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ring-1 ring-inset ${statusPillClass[tx.status]}`}
            >
              {STATUS_LABEL[tx.status]}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ring-1 ring-inset ${channelPillClass[tx.channel]}`}
            >
              {channelLabel[tx.channel]}
            </span>
            <span className="ml-auto text-sm font-semibold tabular-nums text-zinc-900">
              {formatMoney(livePreviewAmount)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className={`${adminModalBody} min-h-0 flex-1 space-y-5 overflow-y-auto`}>
            <label className="block">
              <span className={LABEL_BASE}>Ticket ID</span>
              <input
                value={reference}
                disabled
                readOnly
                className={`${FIELD_BASE} font-mono`}
              />
            </label>
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
            <DropdownSelect<VehicleType>
              label="Vehicle type"
              value={vehicleType}
              options={vehicleOptions}
              onChange={() => {}}
              disabled
            />
            <DropdownSelect<PaymentChannel>
              label="Payment type"
              value={channel}
              options={channelOptions}
              onChange={() => {}}
              disabled
            />
          </div>

          <div className={adminModalFooter}>
            <button type="button" onClick={onClose} className={adminBtnSecondary}>
              Cancel
            </button>
            <button type="submit" className={adminBtnPrimary}>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
