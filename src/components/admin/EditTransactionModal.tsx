import { useEffect, useMemo, useState, type FormEvent } from 'react'
import DropdownSelect from './DropdownSelect'
import { channelLabel, PAYMENT_CHANNELS } from '../../lib/channelStyles'
import { vehicleLabel, VEHICLE_TYPES } from '../../lib/vehicleStyles'
import type {
  PaymentChannel,
  Transaction,
  TransactionStatus,
  VehicleType,
} from '../../types/transaction'

const STATUSES: TransactionStatus[] = [
  'completed',
  'pending',
  'failed',
  'reconciled',
]

const STATUS_LABEL: Record<TransactionStatus, string> = {
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

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditTransactionModal({
  tx,
  open,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  const [reference, setReference] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [amount, setAmount] = useState('')
  const [channel, setChannel] = useState<PaymentChannel>('transfer')
  const [vehicleType, setVehicleType] = useState<VehicleType>('car')
  const [status, setStatus] = useState<TransactionStatus>('completed')
  const [notes, setNotes] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  useEffect(() => {
    if (!tx) return
    setReference(tx.reference)
    setCustomerName(tx.customerName)
    setAmount(String(tx.amount))
    setChannel(tx.channel)
    setVehicleType(tx.vehicleType)
    setStatus(tx.status)
    setNotes(tx.notes)
    setCreatedAt(toLocalInput(tx.createdAt))
  }, [tx])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
  const statusOptions = useMemo(
    () => STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
    [],
  )

  if (!open || !tx) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(amount.replace(/,/g, ''))
    if (!Number.isFinite(n)) return
    onSave(tx.id, {
      reference: reference.trim(),
      customerName: customerName.trim(),
      amount: n,
      channel,
      vehicleType,
      status,
      notes: notes.trim(),
      createdAt: new Date(createdAt).toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tx-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl ring-1 ring-zinc-950/5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-tx-title" className="text-lg font-bold text-zinc-950">
              Edit transaction
            </h2>
            <p className="mt-1 text-sm text-zinc-500">ID: {tx.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ticket ID
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm outline-none ring-zinc-950/5 focus:border-zinc-300 focus:bg-white focus:ring-4"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Customer
            </span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm outline-none ring-zinc-950/5 focus:border-zinc-300 focus:bg-white focus:ring-4"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Amount
            </span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm tabular-nums outline-none ring-zinc-950/5 focus:border-zinc-300 focus:bg-white focus:ring-4"
              required
            />
          </label>
          <DropdownSelect<VehicleType>
            label="Vehicle type"
            value={vehicleType}
            options={vehicleOptions}
            onChange={setVehicleType}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <DropdownSelect<PaymentChannel>
              label="Payment type"
              value={channel}
              options={channelOptions}
              onChange={setChannel}
            />
            <DropdownSelect<TransactionStatus>
              label="Status"
              value={status}
              options={statusOptions}
              onChange={setStatus}
            />
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Date & time
            </span>
            <input
              type="datetime-local"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm outline-none ring-zinc-950/5 focus:border-zinc-300 focus:bg-white focus:ring-4"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm outline-none ring-zinc-950/5 focus:border-zinc-300 focus:bg-white focus:ring-4"
            />
          </label>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
