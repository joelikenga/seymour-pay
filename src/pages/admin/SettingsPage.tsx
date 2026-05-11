import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import ChangePasswordModal from '../../components/admin/ChangePasswordModal'
import { useAdminData } from '../../context/AdminDataContext'
import {
  ADMIN_PAGE_KEYS,
  ADMIN_PAGE_LABELS,
  defaultPageAccess,
  type AdminPageKey,
  type AdminUserRecord,
} from '../../types/adminUser'

const inputClass =
  'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-inner outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20'

const modalShell =
  'w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.22)] ring-1 ring-zinc-950/5'

const btnSecondary =
  'rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50'

const btnAccent =
  'rounded-xl bg-linear-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700'

const btnDanger =
  'rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100'

function PageAccessToggle({
  allowed,
  label,
  onChange,
  disabled,
}: {
  allowed: boolean
  label: string
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={allowed}
      disabled={disabled}
      onClick={() => onChange(!allowed)}
      className={`relative inline-flex h-7 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
        allowed
          ? 'border-orange-500 bg-orange-500'
          : 'border-zinc-300 bg-zinc-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.98]'}`}
      title={label}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200 ease-out ${
          allowed ? 'translate-x-[22px]' : 'translate-x-1'
        }`}
      />
      <span className="sr-only">{label}</span>
    </button>
  )
}

function initialsFromUser(user: AdminUserRecord): string {
  const a = user.firstName.trim().slice(0, 1)
  const b = user.lastName.trim().slice(0, 1)
  return `${a}${b}`.toUpperCase() || '?'
}

function ModalBackdrop({
  children,
  zClass = 'z-50',
}: {
  children: ReactNode
  zClass?: string
}) {
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-[2px] ${zClass}`}
    >
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const {
    adminUsers,
    addAdminUser,
    removeAdminUser,
    replaceUserPageAccess,
    appendLog,
  } = useAdminData()

  /** Pending page-access edits until Save — keyed by user id. */
  const [pageAccessDraft, setPageAccessDraft] = useState<
    Record<string, Record<AdminPageKey, boolean>>
  >({})
  /** When set, confirmation modal is open to save access for this user only. */
  const [accessSaveUserId, setAccessSaveUserId] = useState<string | null>(null)

  useEffect(() => {
    const validIds = new Set(adminUsers.map((u) => u.id))
    setPageAccessDraft((prev) => {
      let changed = false
      const next = { ...prev }
      for (const id of Object.keys(next)) {
        if (!validIds.has(id)) {
          delete next[id]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [adminUsers])

  useEffect(() => {
    if (!accessSaveUserId) return
    if (!adminUsers.some((u) => u.id === accessSaveUserId)) {
      setAccessSaveUserId(null)
    }
  }, [accessSaveUserId, adminUsers])

  const hasUnsavedAccessChanges = Object.keys(pageAccessDraft).length > 0

  const effectivePageAccess = useCallback(
    (user: AdminUserRecord): Record<AdminPageKey, boolean> => {
      const draft = pageAccessDraft[user.id]
      if (draft) return draft
      return { ...defaultPageAccess(), ...user.pageAccess }
    },
    [pageAccessDraft],
  )

  const handleDraftToggle = useCallback((user: AdminUserRecord, page: AdminPageKey, allowed: boolean) => {
    setPageAccessDraft((prev) => {
      const base = prev[user.id] ?? { ...defaultPageAccess(), ...user.pageAccess }
      const next = { ...base, [page]: allowed }
      const saved = { ...defaultPageAccess(), ...user.pageAccess }
      const unchanged = ADMIN_PAGE_KEYS.every((k) => next[k] === saved[k])
      if (unchanged) {
        const { [user.id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [user.id]: next }
    })
  }, [])

  const discardAccessDraft = useCallback(() => {
    setPageAccessDraft({})
    setAccessSaveUserId(null)
  }, [])

  const applyAccessForUser = useCallback(
    (userId: string) => {
      const access = pageAccessDraft[userId]
      if (!access) {
        setAccessSaveUserId(null)
        return
      }
      replaceUserPageAccess(userId, access)
      const u = adminUsers.find((x) => x.id === userId)
      if (u) {
        appendLog({
          action: 'settings',
          summary: 'Page access updated',
          detail: `Saved access for ${u.firstName} ${u.lastName} (${u.email}).`,
        })
      }
      setPageAccessDraft((prev) => {
        const { [userId]: _, ...rest } = prev
        return rest
      })
      setAccessSaveUserId(null)
    },
    [pageAccessDraft, adminUsers, replaceUserPageAccess, appendLog],
  )

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [createAck, setCreateAck] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState<1 | 2>(1)
  const [copyError, setCopyError] = useState<string | null>(null)

  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null)
  const [removeAck, setRemoveAck] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const [lastCreated, setLastCreated] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)
  const [copyDone, setCopyDone] = useState(false)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  const openCreateModal = useCallback(() => {
    setFormError(null)
    setCopyError(null)
    setCreateAck(false)
    setCreateStep(1)
    setLastCreated(null)
    setCopyDone(false)
    setCreateOpen(true)
  }, [])

  const closeCreateFlow = useCallback(() => {
    setCreateOpen(false)
    setCreateStep(1)
    setCreateAck(false)
    setLastCreated(null)
    setCopyDone(false)
    setCopyError(null)
  }, [])

  const openRemoveFlow = useCallback((id: string) => {
    setRemoveTargetId(id)
    setRemoveAck(false)
    setRemoveError(null)
  }, [])

  const closeRemoveFlow = useCallback(() => {
    setRemoveTargetId(null)
    setRemoveAck(false)
    setRemoveError(null)
  }, [])

  const handleCreateSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      setFormError(null)
      if (!email.trim() || !firstName.trim() || !lastName.trim()) {
        setFormError('Enter email, first name, and last name.')
        return
      }
      if (!createAck) {
        setFormError('Confirm the checkbox to continue.')
        return
      }
      const result = addAdminUser({ email, firstName, lastName })
      if (result.ok === false) {
        if (result.error === 'duplicate_email') {
          setFormError('That email was already added.')
        } else {
          setFormError('Could not create user — check all fields.')
        }
        return
      }
      const displayName = `${result.user.firstName} ${result.user.lastName}`.trim()
      setLastCreated({
        email: result.user.email,
        password: result.password,
        name: displayName,
      })
      setCopyDone(false)
      setCopyError(null)
      setEmail('')
      setFirstName('')
      setLastName('')
      setCreateStep(2)
      appendLog({
        action: 'settings',
        summary: 'Admin user created',
        detail: `Added ${displayName} (${result.user.email}) from Settings.`,
      })
      toast.success('User added', {
        description: `${displayName} can sign in with the temporary password on the next step.`,
      })
    },
    [email, firstName, lastName, createAck, addAdminUser, appendLog],
  )

  const handleConfirmRemove = useCallback(() => {
    setRemoveError(null)
    if (!removeAck) {
      setRemoveError('Confirm the checkbox to continue.')
      return
    }
    if (!removeTargetId) return
    const user = adminUsers.find((u) => u.id === removeTargetId)
    if (!user) {
      closeRemoveFlow()
      return
    }
    removeAdminUser(user.id)
    appendLog({
      action: 'settings',
      summary: 'Admin user removed',
      detail: `Removed ${user.email} from Settings.`,
    })
    closeRemoveFlow()
  }, [removeAck, removeTargetId, adminUsers, removeAdminUser, appendLog, closeRemoveFlow])

  const copyCredentials = useCallback(async () => {
    if (!lastCreated) return
    const body = `Email: ${lastCreated.email}\nPassword: ${lastCreated.password}\n\nPlease ask them to reset their password after first sign-in.`
    try {
      await navigator.clipboard.writeText(body)
      setCopyDone(true)
      setCopyError(null)
      toast.success('Copied to clipboard', {
        description: 'Email and temporary password are ready to paste securely.',
      })
      window.setTimeout(() => setCopyDone(false), 2500)
    } catch {
      setCopyError('Could not copy.')
      toast.error('Could not copy', {
        description: 'Allow clipboard access or copy the fields manually.',
      })
    }
  }, [lastCreated])

  const userPendingRemove = adminUsers.find((u) => u.id === removeTargetId)

  const accessSaveTargetUser = useMemo(
    () =>
      accessSaveUserId ? adminUsers.find((u) => u.id === accessSaveUserId) : undefined,
    [accessSaveUserId, adminUsers],
  )

  const userCountLabel = useMemo(() => {
    const n = adminUsers.length
    return `${n} ${n === 1 ? 'person' : 'people'}`
  }, [adminUsers.length])

  return (
    <div className="space-y-8 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-linear-to-br from-white via-orange-50/35 to-zinc-50 p-6 shadow-[0_20px_50px_-40px_rgba(234,88,12,0.18)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-300/50 to-transparent"
          aria-hidden
        />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-800/85">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Settings</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-600">
              Manage who can sign in and which areas of the console they can open.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Team</span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold tabular-nums text-orange-950">
              {userCountLabel}
            </span>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_16px_48px_-36px_rgba(15,23,42,0.18)] ring-1 ring-zinc-950/[0.03]">
        <div className="flex flex-col gap-4 border-b border-zinc-100 bg-linear-to-r from-zinc-50/90 via-white to-sky-50/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 15v2M6 20h12a2 2 0 002-2v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2zM12 15V9m0 0a3 3 0 100-6 3 3 0 000 6z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-950">Your password</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Opens a secure dialog — use your current password to set a new one.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className={`${btnAccent} shrink-0`}
          >
            Change password
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_16px_48px_-36px_rgba(15,23,42,0.18)] ring-1 ring-zinc-950/[0.03]">
        <div className="border-b border-zinc-100 bg-linear-to-r from-zinc-50/90 via-white to-orange-50/25 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-zinc-950">Users & access</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Toggle page access, then click <span className="font-medium text-zinc-800">Save</span> on that row to
                  confirm.{' '}
                  {hasUnsavedAccessChanges ? (
                    <button
                      type="button"
                      onClick={discardAccessDraft}
                      className="font-medium text-orange-700 underline decoration-orange-200 underline-offset-2 hover:text-orange-900"
                    >
                      Discard all
                    </button>
                  ) : null}
                </p>
              </div>
            </div>
            <button type="button" onClick={openCreateModal} className={`${btnAccent} shrink-0`}>
              Create user
            </button>
          </div>
        </div>

        {adminUsers.length === 0 ? (
          <div className="px-6 py-14 text-center sm:px-8">
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-8 py-12">
              <p className="text-base font-semibold text-zinc-800">No users yet</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Add someone with <span className="font-semibold text-zinc-800">Create user</span> and share their one-time credentials.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-gutter:stable]">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-linear-to-b from-zinc-50 to-zinc-50/40">
                  <th className="whitespace-nowrap px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    User
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Email
                  </th>
                  {ADMIN_PAGE_KEYS.map((key) => (
                    <th
                      key={key}
                      className="whitespace-nowrap px-2 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                    >
                      <span className="hidden xl:inline">{ADMIN_PAGE_LABELS[key]}</span>
                      <span className="xl:hidden" title={ADMIN_PAGE_LABELS[key]}>
                        {ADMIN_PAGE_LABELS[key].slice(0, 4)}
                      </span>
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {adminUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    pageAccess={effectivePageAccess(user)}
                    pendingEdits={Boolean(pageAccessDraft[user.id])}
                    onToggle={(page, allowed) => handleDraftToggle(user, page, allowed)}
                    onSave={() => setAccessSaveUserId(user.id)}
                    onRemove={() => openRemoveFlow(user.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create user — step 1 */}
      {createOpen && createStep === 1 ? (
        <ModalBackdrop>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className={`${modalShell} max-w-lg`}
          >
            <h2 id="create-user-title" className="text-lg font-bold text-zinc-950">
              Create user
            </h2>
            <p className="mt-1 text-sm text-zinc-600">New users get a one-time password after you confirm.</p>
            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  className={inputClass}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-zinc-700">First name</span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-zinc-700">Last name</span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-3">
                <input
                  type="checkbox"
                  checked={createAck}
                  onChange={(e) => setCreateAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm leading-snug text-zinc-700">
                  I confirm this person should receive admin access.
                </span>
              </label>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button type="button" onClick={closeCreateFlow} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" className={btnAccent}>
                  Create account
                </button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      ) : null}

      {/* Create user — credentials */}
      {createOpen && createStep === 2 && lastCreated ? (
        <ModalBackdrop>
          <div role="dialog" aria-modal="true" className={modalShell}>
            <h2 className="text-lg font-bold text-zinc-950">Account created</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Share securely. They should reset their password after first sign-in.
            </p>
            <dl className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/90 p-4 text-sm ring-1 ring-zinc-100">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email</dt>
                <dd className="mt-1 break-all font-mono text-sm font-medium text-zinc-900">{lastCreated.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Temporary password
                </dt>
                <dd className="mt-1 break-all font-mono text-sm font-medium text-zinc-900">{lastCreated.password}</dd>
              </div>
            </dl>
            {copyError ? <p className="mt-3 text-sm text-red-600">{copyError}</p> : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
              <button type="button" onClick={() => void copyCredentials()} className={btnSecondary}>
                {copyDone ? 'Copied' : 'Copy email & password'}
              </button>
              <button type="button" onClick={closeCreateFlow} className={btnAccent}>
                Done
              </button>
            </div>
          </div>
        </ModalBackdrop>
      ) : null}

      {/* Confirm save page access (per row) */}
      {accessSaveUserId && accessSaveTargetUser ? (
        <ModalBackdrop zClass="z-[60]">
          <div role="dialog" aria-modal="true" aria-labelledby="save-access-title" className={modalShell}>
            <h2 id="save-access-title" className="text-lg font-bold text-zinc-950">
              Save access for this user?
            </h2>
            <p className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700">
              <span className="font-semibold text-zinc-900">
                {accessSaveTargetUser.firstName} {accessSaveTargetUser.lastName}
              </span>
              <span className="mt-0.5 block truncate text-zinc-500">{accessSaveTargetUser.email}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              This applies the page permissions shown in the row. You can edit them again anytime.
            </p>
            <div className="mt-5 flex justify-end gap-2 border-t border-zinc-100 pt-4">
              <button type="button" onClick={() => setAccessSaveUserId(null)} className={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyAccessForUser(accessSaveUserId)}
                className={btnAccent}
              >
                Confirm save
              </button>
            </div>
          </div>
        </ModalBackdrop>
      ) : null}

      {/* Remove user */}
      {userPendingRemove ? (
        <ModalBackdrop>
          <div role="dialog" aria-modal="true" aria-labelledby="remove-user-title" className={modalShell}>
            <h2 id="remove-user-title" className="text-lg font-bold text-zinc-950">
              Remove user
            </h2>
            <p className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700">
              <span className="font-semibold text-zinc-900">
                {userPendingRemove.firstName} {userPendingRemove.lastName}
              </span>
              <span className="mt-0.5 block truncate text-zinc-500">{userPendingRemove.email}</span>
            </p>
            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-3">
                <input
                  type="checkbox"
                  checked={removeAck}
                  onChange={(e) => setRemoveAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm leading-snug text-zinc-700">
                  I understand this user will lose admin access.
                </span>
              </label>
              {removeError ? <p className="text-sm text-red-600">{removeError}</p> : null}
              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button type="button" onClick={closeRemoveFlow} className={btnSecondary}>
                  Cancel
                </button>
                <button type="button" onClick={handleConfirmRemove} className={btnDanger}>
                  Remove user
                </button>
              </div>
            </div>
          </div>
        </ModalBackdrop>
      ) : null}

      <ChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
      />
    </div>
  )
}

function UserRow({
  user,
  pageAccess,
  pendingEdits,
  onToggle,
  onSave,
  onRemove,
}: {
  user: AdminUserRecord
  pageAccess: Record<AdminPageKey, boolean>
  pendingEdits: boolean
  onToggle: (page: AdminPageKey, allowed: boolean) => void
  onSave: () => void
  onRemove: () => void
}) {
  const name = `${user.firstName} ${user.lastName}`.trim()
  const initials = initialsFromUser(user)

  return (
    <tr
      className={`transition-colors hover:bg-orange-50/40 ${pendingEdits ? 'bg-amber-50/50' : ''}`}
    >
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-100 to-orange-50 text-xs font-bold text-orange-950 ring-1 ring-orange-200/70">
            {initials}
          </span>
          <span className="font-semibold text-zinc-900">{name}</span>
        </div>
      </td>
      <td className="max-w-[220px] truncate px-5 py-4 text-zinc-600" title={user.email}>
        {user.email}
      </td>
      {ADMIN_PAGE_KEYS.map((key) => (
        <td key={key} className="px-2 py-4 text-center align-middle">
          <div className="flex justify-center">
            <PageAccessToggle
              allowed={pageAccess[key] ?? defaultPageAccess()[key]}
              label={ADMIN_PAGE_LABELS[key]}
              onChange={(next) => onToggle(key, next)}
            />
          </div>
        </td>
      ))}
      <td className="whitespace-nowrap px-5 py-4 text-right">
        {pendingEdits ? (
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-linear-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
          >
            Save
          </button>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-950/5 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900"
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  )
}
