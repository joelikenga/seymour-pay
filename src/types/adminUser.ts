export const ADMIN_PAGE_KEYS = [
  'dashboard',
  'transactions',
  'settlement',
  'analytics',
  'logs',
  'reconciliation',
  'settings',
] as const

export type AdminPageKey = (typeof ADMIN_PAGE_KEYS)[number]

export const ADMIN_PAGE_LABELS: Record<AdminPageKey, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  settlement: 'Settlement',
  analytics: 'Analytics',
  logs: 'Logs',
  reconciliation: 'Reconciliation',
  settings: 'Settings',
}

export function defaultPageAccess(): Record<AdminPageKey, boolean> {
  return {
    dashboard: true,
    transactions: true,
    settlement: true,
    analytics: true,
    logs: true,
    reconciliation: true,
    settings: true,
  }
}

export interface AdminUserRecord {
  id: string
  email: string
  firstName: string
  lastName: string
  pageAccess: Record<AdminPageKey, boolean>
}
