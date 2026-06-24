import { ADMIN_PAGE_KEYS, type AdminPageKey } from '../types/adminUser'

/** Wire format for admin user `pageAccess` on the server. */
const PAGE_KEY_TO_API: Record<AdminPageKey, string> = {
  dashboard: 'dashboard',
  transactions: 'transactions',
  lostTickets: 'lost_tickets',
  settlement: 'settlement',
  analytics: 'analytics',
  logs: 'logs',
  reconciliation: 'reconciliation',
  settings: 'settings',
}

const API_KEY_TO_PAGE: Record<string, AdminPageKey> = {
  dashboard: 'dashboard',
  transactions: 'transactions',
  lost_tickets: 'lostTickets',
  lostTickets: 'lostTickets',
  settlement: 'settlement',
  analytics: 'analytics',
  logs: 'logs',
  reconciliation: 'reconciliation',
  settings: 'settings',
}

/**
 * Keys the server accepts on `POST /admin/users` today.
 * New accounts only get dashboard + transactions; grant other pages via Settings.
 */
const CREATE_USER_API_PAGE_KEYS: AdminPageKey[] = ['dashboard', 'transactions']

/** `POST /admin/users` — only enabled pages; never send unknown keys. */
export function newUserPageAccessApiPayload(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const k of CREATE_USER_API_PAGE_KEYS) {
    out[PAGE_KEY_TO_API[k]] = true
  }
  return out
}

/** `PATCH …/page-access` — map app keys to API wire names (`lostTickets` → `lost_tickets`). */
export function pageAccessToApiPayload(
  access: Record<AdminPageKey, boolean>,
): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const k of ADMIN_PAGE_KEYS) {
    out[PAGE_KEY_TO_API[k]] = Boolean(access[k])
  }
  return out
}

/** Normalize API `pageAccess` / `page_access` into the app map. */
export function pageAccessFromApiRaw(
  raw: Partial<Record<string, boolean>> | null | undefined,
): Record<AdminPageKey, boolean> {
  const out = {} as Record<AdminPageKey, boolean>
  for (const k of ADMIN_PAGE_KEYS) {
    out[k] = false
  }
  if (!raw || typeof raw !== 'object') return out
  for (const [key, allowed] of Object.entries(raw)) {
    const page = API_KEY_TO_PAGE[key]
    if (page) out[page] = Boolean(allowed)
  }
  return out
}
