import { useState } from 'react'
import { toast } from 'sonner'
import {
  createCashierAccount,
  generateCashierPassword,
  type CashierAccount,
} from '../../lib/cashiersService'
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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState(() => generateCashierPassword())
  const [shift, setShift] = useState<'morning' | 'night'>('morning')
  const [submitting, setSubmitting] = useState(false)

  // Success state showing credentials (the ONLY time credentials can be copied)
  const [createdCashier, setCreatedCashier] = useState<CashierAccount | null>(null)

  if (!isOpen) return null

  function handleRegeneratePassword() {
    setPassword(generateCashierPassword())
    toast.success('Generated new password')
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard!`)
  }

  function handleCopyAll(account: CashierAccount) {
    const text = [
      `Seymour Pay - Cashier Account Credentials`,
      `---------------------------------------`,
      `Username: ${account.username}`,
      `Password: ${account.password}`,
      `Shift: ${account.shift.toUpperCase()} SHIFT`,
      `Portal: ${window.location.origin}/login`,
    ].join('\n')

    navigator.clipboard.writeText(text)
    toast.success('All cashier login details copied to clipboard!')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanUser = username.trim()
    if (!cleanUser) {
      toast.error('Please enter a username for the cashier')
      return
    }
    if (!password.trim()) {
      toast.error('Please generate a password')
      return
    }

    setSubmitting(true)
    try {
      const newAccount = createCashierAccount({
        username: cleanUser,
        password: password.trim(),
        shift,
        status: 'active',
      })

      setCreatedCashier(newAccount)
      onSuccess(newAccount)
      toast.success('Cashier account created successfully!')
    } catch {
      toast.error('Could not save cashier account')
    } finally {
      setSubmitting(false)
    }
  }

  function handleResetAndClose() {
    setCreatedCashier(null)
    setUsername('')
    setPassword(generateCashierPassword())
    setShift('morning')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className={`${adminModalPanel} max-w-lg`}>
        {createdCashier ? (
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
                      <p className="font-bold text-zinc-900">{createdCashier.username}</p>
                      <p className="text-xs text-zinc-500 capitalize">
                        {createdCashier.shift} shift
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

                    {/* Password card (visible) */}
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Password
                        </p>
                        <p className="font-mono text-sm font-bold text-zinc-900">
                          {createdCashier.password}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdCashier.password, 'Password')}
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
                    Please copy and store these credentials now. For security, login credentials can only be copied upon cashier creation and will not be displayed on the cashier profile.
                  </p>
                </div>
              </div>
            </div>

            <div className={`${adminModalFooter} flex items-center justify-between`}>
              <button
                type="button"
                onClick={() => handleCopyAll(createdCashier)}
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
                Enter the cashier username and select a shift. Password is auto-generated.
              </p>
            </div>

            <div className={adminModalBody}>
              <div className="space-y-4 text-xs">
                {/* Username (typed by user, not auto gen) */}
                <div>
                  <label className="block font-bold text-zinc-700">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. ada_okafor"
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    This username will be used by the cashier to log in.
                  </p>
                </div>

                {/* Auto-generated Password (visible, not typed) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-zinc-700">
                      Auto-generated Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      className="text-[11px] font-semibold text-orange-700 hover:text-orange-900"
                    >
                      ↻ Regenerate
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      readOnly
                      required
                      value={password}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 font-mono text-sm font-semibold text-zinc-900 shadow-2xs cursor-not-allowed outline-none select-all"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Password is auto-generated and visible. It cannot be typed manually.
                  </p>
                </div>

                {/* Shift Selection (just morning and night) */}
                <div>
                  <label className="block font-bold text-zinc-700">Assigned Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as 'morning' | 'night')}
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-2xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="morning">Morning Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>
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
