import { useState } from 'react'
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

interface CreateCashierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (cashier: CashierAccount) => void
}

export default function CreateCashierModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCashierModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [shift, setShift] = useState<'morning' | 'night'>('morning')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Success state showing credentials with one-time password from API
  const [createdCashier, setCreatedCashier] = useState<CashierAccount | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  if (!isOpen) return null

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard!`)
  }

  function handleCopyAll(account: CashierAccount, passwordText: string) {
    const shiftLabel =
      (account.gate || shift).toLowerCase().includes('night') ? 'NIGHT SHIFT' : 'MORNING SHIFT'

    const text = [
      `Seymour Pay - Cashier Account Credentials`,
      `---------------------------------------`,
      `Name: ${account.name || `${account.firstName} ${account.lastName}`.trim()}`,
      `Username: ${account.username}`,
      `Shift: ${shiftLabel}`,
      `One-time Password: ${passwordText}`,
      `Portal: ${window.location.origin}/login`,
    ].join('\n')

    navigator.clipboard.writeText(text)
    toast.success('All cashier login details copied to clipboard!')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const cleanFirst = firstName.trim()
    const cleanLast = lastName.trim()
    const cleanUser = username.trim()

    if (!cleanFirst || !cleanLast) {
      setErrorMessage('Please enter both first and last name.')
      return
    }
    if (!cleanUser) {
      setErrorMessage('Please enter a username.')
      return
    }

    setSubmitting(true)
    try {
      // Backend gate parameter represents the cashier shift
      const response = await CashierAccountsApi.adminCreateCashierAccount({
        firstName: cleanFirst,
        lastName: cleanLast,
        username: cleanUser,
        gate: shift,
      })

      const cashier = response.cashier
      const oneTimePassword = response.password

      setCreatedCashier(cashier)
      setCreatedPassword(oneTimePassword)
      onSuccess(cashier)
      toast.success('Cashier account created successfully!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create cashier account.'
      setErrorMessage(msg)
      toastRequestFailed('Could not create cashier account', err)
    } finally {
      setSubmitting(false)
    }
  }

  function handleResetAndClose() {
    setCreatedCashier(null)
    setCreatedPassword(null)
    setFirstName('')
    setLastName('')
    setUsername('')
    setShift('morning')
    setErrorMessage(null)
    onClose()
  }

  const shiftDisplayName =
    createdCashier?.gate?.toLowerCase().includes('night') || shift === 'night'
      ? 'Night Shift'
      : 'Morning Shift'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className={`${adminModalPanel} max-w-lg`}>
        {createdCashier && createdPassword ? (
          /* Credentials Presentation View - ONLY time credentials can be copied */
          <div>
            <div className={`${adminModalHeader} bg-emerald-50/60 border-b border-emerald-100`}>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Account Created Successfully!
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Copy and share these login credentials with the cashier now.
                  </p>
                </div>
              </div>
            </div>

            <div className={adminModalBody}>
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 font-bold text-white shadow-sm">
                      {createdCashier.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">
                        {createdCashier.name || `${createdCashier.firstName} ${createdCashier.lastName}`.trim()}
                      </p>
                      <p className="text-xs text-zinc-500">
                        @{createdCashier.username} • {shiftDisplayName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {/* Username card */}
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Username
                        </p>
                        <p className="font-mono text-sm font-bold text-zinc-900">
                          {createdCashier.username}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdCashier.username, 'Username')}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-95"
                      >
                        Copy
                      </button>
                    </div>

                    {/* Assigned Shift card */}
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Assigned Shift
                        </p>
                        <p className="text-sm font-semibold text-zinc-800">
                          {shiftDisplayName}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-900">
                        {shift.toUpperCase()}
                      </span>
                    </div>

                    {/* One-time password card (visible) */}
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          One-Time Password
                        </p>
                        <p className="font-mono text-sm font-bold text-zinc-900">
                          {createdPassword}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdPassword, 'Password')}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-95"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900">
                  <p className="font-semibold">⚠️ Important Notice</p>
                  <p className="mt-0.5">
                    Please copy and store these credentials now. For security, login credentials can only be copied upon cashier creation and cannot be retrieved later.
                  </p>
                </div>
              </div>
            </div>

            <div className={`${adminModalFooter} flex items-center justify-between`}>
              <button
                type="button"
                onClick={() => handleCopyAll(createdCashier, createdPassword)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                </svg>
                Copy All Credentials
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className={adminBtnPrimary}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Account Creation Form */
          <form onSubmit={handleSubmit}>
            <div className={adminModalHeader}>
              <h2 className={adminModalTitle}>Create Cashier Account</h2>
              <p className={adminModalSubtitle}>
                Add a new cashier profile. The server generates a secure one-time password upon creation.
              </p>
            </div>

            <div className={adminModalBody}>
              <div className="space-y-4 text-xs">
                {/* Names (firstName & lastName) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-bold text-zinc-700">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block font-bold text-zinc-700">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. cashier_username"
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Cashier username used for portal sign-in and transaction tracking.
                  </p>
                </div>

                {/* Assigned Shift dropdown (div-based DropdownSelect) */}
                <DropdownSelect<'morning' | 'night'>
                  label="Assigned Shift *"
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
                onClick={handleResetAndClose}
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
                {submitting ? 'Creating…' : 'Create Cashier Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
