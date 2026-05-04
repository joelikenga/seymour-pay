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
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

const DEMO_USER = 'Seymour Ops'

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => [...seedTransactions],
  )
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => [...seedAuditLogs])

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

  const value = useMemo(
    () => ({
      transactions,
      updateTransaction,
      deleteTransactions,
      logs,
      appendLog,
    }),
    [transactions, updateTransaction, deleteTransactions, logs, appendLog],
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
