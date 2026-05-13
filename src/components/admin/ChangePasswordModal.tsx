import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useAdminData } from '../../context/AdminDataContext'
import { AuthApi } from '../../utils'
import { adminProfileQueryKey } from '../../query/adminProfile'
import { queryClient } from '../../query/queryClient'
import {
  ADMIN_NEW_PASSWORD_MIN_LENGTH,
  checkAdminPasswordRequirements,
  isAdminPasswordPolicySatisfied,
} from '../../lib/adminPasswordPolicy'

const inputClass =
  'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-inner outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20'

const btnNeutral =
  'rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50'

const btnAccent =
  'rounded-xl bg-linear-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 disabled:pointer-events-none disabled:opacity-60'

export interface ChangePasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const { appendLog } = useAdminData()
  const reqGroupId = useId()
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null,
  )
  const [passwordChangeBusy, setPasswordChangeBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordChangeError(null)
      setPasswordChangeBusy(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => firstFieldRef.current?.focus())
  }, [open])

  const newPasswordChecks = useMemo(
    () => checkAdminPasswordRequirements(newPassword),
    [newPassword],
  )

  const newPasswordPolicyInline = useMemo(
    () =>
      [
        {
          key: 'min',
          met: newPasswordChecks.minLength,
          short: `(min ${ADMIN_NEW_PASSWORD_MIN_LENGTH})`,
        },
        { key: 'upper', met: newPasswordChecks.hasUpper, short: '(A-Z)' },
        { key: 'lower', met: newPasswordChecks.hasLower, short: '(a-z)' },
        { key: 'digit', met: newPasswordChecks.hasDigit, short: '(0-9)' },
        {
          key: 'special',
          met: newPasswordChecks.hasSpecial,
          short: '(symbol)',
        },
      ] as const,
    [newPasswordChecks],
  )

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setPasswordChangeError(null)
      if (!isAdminPasswordPolicySatisfied(newPassword)) {
        setPasswordChangeError(
          `Use at least ${ADMIN_NEW_PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, a number, and a symbol.`,
        )
        return
      }
      if (newPassword !== confirmPassword) {
        setPasswordChangeError('New password and confirmation do not match.')
        return
      }
      setPasswordChangeBusy(true)
      try {
        await AuthApi.adminChangePassword(currentPassword, newPassword)
        void queryClient.invalidateQueries({ queryKey: adminProfileQueryKey })
        appendLog({
          action: 'settings',
          summary: 'Password updated',
          detail: 'Admin password was changed successfully.',
        })
        toast.success('Password updated', {
          description: 'Your admin password was changed successfully.',
        })
        onOpenChange(false)
      } catch (err) {
        setPasswordChangeError(
          err instanceof Error ? err.message : 'Could not change password.',
        )
      } finally {
        setPasswordChangeBusy(false)
      }
    },
    [
      appendLog,
      confirmPassword,
      currentPassword,
      newPassword,
      onOpenChange,
    ],
  )

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[3px] transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={reqGroupId + '-title'}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200/95 bg-white shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)] ring-1 ring-zinc-950/8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 bg-linear-to-r from-zinc-50/95 via-white to-orange-50/40 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-800/85">
                Account security
              </p>
              <h2
                id={`${reqGroupId}-title`}
                className="mt-1 text-xl font-bold tracking-tight text-zinc-950"
              >
                Change password
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                Enter your current password, then choose a strong new one.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800"
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6"
        >
          {passwordChangeError ? (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {passwordChangeError}
            </p>
          ) : null}

          <div className="grid flex-1 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">
                Current password
              </span>
              <input
                ref={firstFieldRef}
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">
                New password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={ADMIN_NEW_PASSWORD_MIN_LENGTH}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                aria-describedby={`${reqGroupId}-req`}
              />
              <div
                id={`${reqGroupId}-req`}
                className="mt-2 flex flex-nowrap items-center gap-x-3 overflow-x-auto pb-0.5 text-[13px] tabular-nums tracking-tight text-zinc-600"
                role="group"
                aria-label="New password requirements"
              >
                {newPasswordPolicyInline.map(({ key, met, short }) => (
                  <span
                    key={key}
                    className="inline-flex shrink-0 items-center gap-1.5"
                  >
                    <span
                      role="checkbox"
                      aria-checked={met}
                      tabIndex={-1}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold leading-none transition-colors ${
                        met
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                          : 'border-zinc-300 bg-white text-transparent'
                      }`}
                    >
                      {met ? '✓' : null}
                    </span>
                    <span
                      className={
                        met ? 'font-semibold text-emerald-800' : 'text-zinc-400'
                      }
                    >
                      {short}
                    </span>
                  </span>
                ))}
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">
                Confirm new password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              className={btnNeutral}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                passwordChangeBusy || !isAdminPasswordPolicySatisfied(newPassword)
              }
              className={btnAccent}
            >
              {passwordChangeBusy ? 'Saving…' : 'Save new password'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
