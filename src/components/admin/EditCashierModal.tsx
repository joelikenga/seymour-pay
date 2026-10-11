import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import DropdownSelect from './DropdownSelect'
import { CashierAccountsApi } from '../../utils'
import type { CashierAccount } from '../../types/cashierAccount'
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminModalBody,
  adminModalFooter,
  adminModalHeader,
  adminModalPanel,
  adminModalSubtitle,
  adminModalTitle,
} from '../../lib/adminModalStyles'
import { toastRequestFailed } from '../../lib/apiErrors'

interface EditCashierModalProps {
  cashier: CashierAccount | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updated: CashierAccount) => void
}

export default function EditCashierModal({
  cashier,
  isOpen,
  onClose,
  onSuccess,
}: EditCashierModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [shift, setShift] = useState<'morning' | 'night'>('morning')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (cashier) {
      setFirstName(cashier.firstName || '')
      setLastName(cashier.lastName || '')
      const isNight =
        cashier.gate?.toLowerCase().includes('night') || cashier.shift === 'night'
      setShift(isNight ? 'night' : 'morning')
      setErrorMessage(null)
    }
  }, [cashier])

  if (!isOpen || !cashier) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cashier) return

    setErrorMessage(null)
    setSubmitting(true)

    try {
      const updated = await CashierAccountsApi.adminUpdateCashierAccount(cashier.id, {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        gate: shift,
      })

      toast.success(`Updated details for @${cashier.username}`)
      onSuccess(updated)
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not update cashier profile.'
      setErrorMessage(msg)
      toastRequestFailed('Could not update cashier profile', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className={`${adminModalPanel} max-w-lg`}>
        <form onSubmit={handleSubmit}>
          <div className={adminModalHeader}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
                {cashier.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className={adminModalTitle}>Edit Cashier Profile</h2>
                <p className={adminModalSubtitle}>
                  Update display name or assigned shift for @{cashier.username}
                </p>
              </div>
            </div>
          </div>

          <div className={adminModalBody}>
            <div className="space-y-4 text-xs">
              {/* Readonly username badge */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Username
                </span>
                <span className="font-mono text-xs font-bold text-zinc-900">
                  @{cashier.username}
                </span>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-zinc-700">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ada"
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Okafor"
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>

                {/* Assigned Shift dropdown (div-based DropdownSelect) */}
                <DropdownSelect<'morning' | 'night'>
                  label="Assigned Shift"
                  value={shift}
                  options={[
                    { value: 'morning', label: 'Morning Shift' },
                    { value: 'night', label: 'Night Shift' },
                  ]}
                  onChange={(val) => setShift(val)}
                  triggerClassName="h-10 bg-white"
                />

              {errorMessage ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </div>

          <div className={adminModalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={adminBtnSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={adminBtnPrimary}
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
