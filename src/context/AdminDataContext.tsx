import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedAuditLogs } from '../data/seedAuditLogs'
import { seedTransactions } from '../data/seedTransactions'
import type { AuditLogEntry, AuditAction } from '../types/auditLog'
import type { Transaction } from '../types/transaction'
import type { AdminPageKey, AdminUserRecord } from '../types/adminUser'
import { defaultPageAccess } from '../types/adminUser'

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const PASSWORD_CHARS =
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generatePassword(length = 14): string {
  const buf = new Uint32Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < length; i++) buf[i] = Math.floor(Math.random() * 2 ** 32)
  }
  let out = ''
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[buf[i] % PASSWORD_CHARS.length]
  }
  return out
}

interface AppendAuditInput {
  action: AuditAction
  summary: string
  detail: string
}

interface AdminDataContextValue {
  transactions: Transaction[]
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  deleteTransactions: (ids: readonly string[]) => void
  logs: AuditLogEntry[]
  appendLog: (entry: AppendAuditInput) => void
  adminUsers: AdminUserRecord[]
  addAdminUser: (input: {
    email: string
    firstName: string
    lastName: string
  }) =>
    | { ok: true; user: AdminUserRecord; password: string }
    | { ok: false; error: 'duplicate_email' | 'invalid' }
  removeAdminUser: (id: string) => void
  setUserPageAccess: (
    userId: string,
    page: AdminPageKey,
    allowed: boolean,
  ) => void
  /** Replace full page access map for one user (e.g. Settings save). */
  replaceUserPageAccess: (
    userId: string,
    pageAccess: Record<AdminPageKey, boolean>,
  ) => void
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

const DEMO_USER = 'Seymour Ops'

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => [...seedTransactions],
  )
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => [...seedAuditLogs])
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => [])

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setTransactions((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }, [])

  /**
   * Delete a batch of transactions by id and return the rows that were removed
   * (callers can use the returned list to write a meaningful audit log entry).
   */
  const deleteTransactions = useCallback(
    (ids: readonly string[]): Transaction[] => {
      if (ids.length === 0) return []
      const lookup = new Set(ids)
      let removed: Transaction[] = []
      setTransactions((rows) => {
        removed = rows.filter((r) => lookup.has(r.id))
        return rows.filter((r) => !lookup.has(r.id))
      })
      return removed
    },
    [],
  )

  const appendLog = useCallback((entry: AppendAuditInput) => {
    const row: AuditLogEntry = {
      id: newId('log'),
      at: new Date().toISOString(),
      userLabel: DEMO_USER,
      ...entry,
    }
    setLogs((prev) => [row, ...prev])
  }, [])

  const addAdminUser = useCallback(
    (input: { email: string; firstName: string; lastName: string }) => {
      const email = input.email.trim().toLowerCase()
      const firstName = input.firstName.trim()
      const lastName = input.lastName.trim()
      if (!email || !firstName || !lastName) {
        return { ok: false as const, error: 'invalid' as const }
      }

      let outcome:
        | { ok: true; user: AdminUserRecord; password: string }
        | { ok: false; error: 'duplicate_email' }
        | undefined

      setAdminUsers((prev) => {
        if (prev.some((u) => u.email.toLowerCase() === email)) {
          outcome = { ok: false, error: 'duplicate_email' }
          return prev
        }
        const password = generatePassword()
        const user: AdminUserRecord = {
          id: newId('user'),
          email,
          firstName,
          lastName,
          pageAccess: defaultPageAccess(),
        }
        outcome = { ok: true, user, password }
        return [...prev, user]
      })

      return outcome ?? { ok: false as const, error: 'duplicate_email' as const }
    },
    [],
  )

  const removeAdminUser = useCallback((id: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const setUserPageAccess = useCallback(
    (userId: string, page: AdminPageKey, allowed: boolean) => {
      setAdminUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, pageAccess: { ...u.pageAccess, [page]: allowed } }
            : u,
        ),
      )
    },
    [],
  )

  const replaceUserPageAccess = useCallback(
    (userId: string, pageAccess: Record<AdminPageKey, boolean>) => {
      const merged = { ...defaultPageAccess(), ...pageAccess }
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, pageAccess: merged } : u)),
      )
    },
    [],
  )

  const value = useMemo(
    () => ({
      transactions,
      updateTransaction,
      deleteTransactions,
      logs,
      appendLog,
      adminUsers,
      addAdminUser,
      removeAdminUser,
      setUserPageAccess,
      replaceUserPageAccess,
    }),
    [
      transactions,
      updateTransaction,
      deleteTransactions,
      logs,
      appendLog,
      adminUsers,
      addAdminUser,
      removeAdminUser,
      setUserPageAccess,
      replaceUserPageAccess,
    ],
  )

  return (
    <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
  )
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider')
  return ctx
}
