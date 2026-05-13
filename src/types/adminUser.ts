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

export interface AdminUserRecord {
  id: string
  email: string
  firstName: string
  lastName: string
  pageAccess: Record<AdminPageKey, boolean>
}

/** Full access map (e.g. `/admin/auth/me` when `pageAccess` is omitted). Not used for new user accounts. */
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

/**
 * Default page access for a newly created admin user (server or client policy).
 * Only Dashboard and Transactions; other sections stay off until granted.
 */
export function initialAdminAccountPageAccess(): Record<AdminPageKey, boolean> {
  const out = {} as Record<AdminPageKey, boolean>
  for (const k of ADMIN_PAGE_KEYS) {
    out[k] = k === 'dashboard' || k === 'transactions'
  }
  return out
}

/** Map API `pageAccess` to a full map (missing keys → `false`). Server may only send toggled keys. */
export function pageAccessFromApi(
  raw: Partial<Record<AdminPageKey, boolean>> | undefined | null,
): Record<AdminPageKey, boolean> {
  const out = {} as Record<AdminPageKey, boolean>
  for (const k of ADMIN_PAGE_KEYS) {
    out[k] = Boolean(raw?.[k])
  }
  return out
}

export function adminUserFromApi(row: {
  id: string
  email: string
  firstName: string
  lastName: string
  pageAccess?: Partial<Record<AdminPageKey, boolean>> | null
}): AdminUserRecord {
  return {
    id: row.id,
    email: row.email.trim().toLowerCase(),
    firstName: row.firstName,
    lastName: row.lastName,
    pageAccess: pageAccessFromApi(row.pageAccess ?? undefined),
  }
}
