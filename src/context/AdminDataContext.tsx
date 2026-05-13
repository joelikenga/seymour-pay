import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedAuditLogs } from '../data/seedAuditLogs'
import { seedTransactions } from '../data/seedTransactions'
import type { AuditLogEntry, AuditAction } from '../types/auditLog'
import type { Transaction } from '../types/transaction'
import type { AdminPageKey, AdminUserRecord } from '../types/adminUser'
import { adminUserFromApi } from '../types/adminUser'
import { adminLogsQueryRootKey } from '../query/adminLogs'
import { dashboardOverviewQueryKey } from '../query/dashboardOverview'
import { adminUsersListShowsAccessDenied, getErrorMessage, toastRequestFailed } from '../lib/apiErrors'
import { getAuditActorLabel } from '../lib/auditActorLabel'
import { queryClient } from '../query/queryClient'
import { LogsApi, UsersApi } from '../utils'
import { hasAdminToken } from '../utils/cookies'

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
  adminUsersLoading: boolean
  adminUsersError: string | null
  refreshAdminUsers: () => Promise<void>
  addAdminUser: (input: {
    email: string
    firstName: string
    lastName: string
  }) => Promise<
    | { ok: true; user: AdminUserRecord; password: string }
    | { ok: false; error: 'duplicate_email' | 'invalid' }
  >
  removeAdminUser: (id: string) => Promise<void>
  setUserPageAccess: (
    userId: string,
    page: AdminPageKey,
    allowed: boolean,
  ) => void
  /** Persist full page access via API, then replace local user from response. */
  replaceUserPageAccess: (
    userId: string,
    pageAccess: Record<AdminPageKey, boolean>,
  ) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => [...seedTransactions],
  )
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => [...seedAuditLogs])
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => [])
  const [adminUsersLoading, setAdminUsersLoading] = useState(true)
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null)

  const refreshAdminUsers = useCallback(async () => {
    if (!hasAdminToken()) {
      setAdminUsers([])
      setAdminUsersError(null)
      setAdminUsersLoading(false)
      return
    }
    setAdminUsersError(null)
    setAdminUsersLoading(true)
    try {
      const rows = await UsersApi.adminGetUsers()
      setAdminUsers(rows.map(adminUserFromApi))
    } catch (e) {
      setAdminUsers([])
      const msg = getErrorMessage(e)
      setAdminUsersError(msg)
      if (!adminUsersListShowsAccessDenied(msg)) {
        toastRequestFailed('Could not load users', e)
      }
    } finally {
      setAdminUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasAdminToken()) {
      setAdminUsers([])
      setAdminUsersError(null)
      setAdminUsersLoading(false)
      return
    }
    void refreshAdminUsers()
  }, [refreshAdminUsers])

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
      userLabel: getAuditActorLabel(),
      ...entry,
    }
    setLogs((prev) => [row, ...prev])
    void LogsApi.adminAddLog({
      action: entry.action,
      summary: entry.summary,
      detail: entry.detail,
    })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: adminLogsQueryRootKey })
        void queryClient.invalidateQueries({ queryKey: dashboardOverviewQueryKey })
      })
      .catch(() => {
        /* demo UI still has local row; server may be offline */
      })
  }, [])

  const addAdminUser = useCallback(
    async (input: { email: string; firstName: string; lastName: string }) => {
      const email = input.email.trim().toLowerCase()
      const firstName = input.firstName.trim()
      const lastName = input.lastName.trim()
      if (!email || !firstName || !lastName) {
        return { ok: false as const, error: 'invalid' as const }
      }
      try {
        const res = await UsersApi.adminCreateUser({
          email,
          firstName,
          lastName,
        })
        const user = adminUserFromApi(res.user)
        setAdminUsers((prev) => {
          const withoutDup = prev.filter((u) => u.id !== user.id)
          return [...withoutDup, user]
        })
        return { ok: true as const, user, password: res.password }
      } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (/duplicate|already|exists|unique|409/i.test(msg)) {
          return { ok: false as const, error: 'duplicate_email' as const }
        }
        throw e instanceof Error ? e : new Error('Could not create user.')
      }
    },
    [],
  )

  const removeAdminUser = useCallback(async (id: string) => {
    await UsersApi.adminDeleteUserById(id)
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
    async (userId: string, pageAccess: Record<AdminPageKey, boolean>) => {
      const raw = await UsersApi.adminUpdateUserById(userId, pageAccess)
      const normalized = adminUserFromApi(raw)
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === userId ? normalized : u)),
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
      adminUsersLoading,
      adminUsersError,
      refreshAdminUsers,
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
      adminUsersLoading,
      adminUsersError,
      refreshAdminUsers,
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
