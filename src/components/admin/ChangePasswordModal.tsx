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
import { toastRequestFailed } from '../../lib/apiErrors'
import { useAdminData } from '../../context/AdminDataContext'
import { AuthApi } from '../../utils'
import { adminProfileQueryKey } from '../../query/adminProfile'
import { queryClient } from '../../query/queryClient'
import {
  ADMIN_NEW_PASSWORD_MIN_LENGTH,
  checkAdminPasswordRequirements,
  isAdminPasswordPolicySatisfied,
} from '../../lib/adminPasswordPolicy'
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

const inputClass =
  'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200'

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
        const msg =
          err instanceof Error ? err.message : 'Could not change password.'
        setPasswordChangeError(msg)
        toastRequestFailed('Could not change password', err)
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
        className={adminModalBackdrop}
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={reqGroupId + '-title'}
        className={`${adminModalPanel} z-10 flex max-h-[min(90vh,720px)] max-w-md flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={adminModalHeader}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={`${reqGroupId}-title`} className={adminModalTitle}>
                Change password
              </h2>
              <p className={adminModalSubtitle}>
                Enter your current password, then choose a strong new one.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={adminModalCloseBtn}
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className={`${adminModalBody} flex-1 space-y-4`}>
            {passwordChangeError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {passwordChangeError}
              </p>
            ) : null}
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

          <div className={adminModalFooter}>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                passwordChangeBusy || !isAdminPasswordPolicySatisfied(newPassword)
              }
              className={adminBtnPrimary}
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
