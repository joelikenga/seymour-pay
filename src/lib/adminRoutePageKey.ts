import { ADMIN_PAGE_KEYS, type AdminPageKey } from '../types/adminUser'

const KEY_SET = new Set<string>(ADMIN_PAGE_KEYS)

export const ADMIN_APP_NAV = [
  { to: '/admin', label: 'Dashboard', end: true as const, page: 'dashboard' as const },
  { to: '/admin/transactions', label: 'Transactions', page: 'transactions' as const },
  { to: '/admin/settlement', label: 'Settlement', page: 'settlement' as const },
  { to: '/admin/analytics', label: 'Analytics', page: 'analytics' as const },
  { to: '/admin/logs', label: 'Logs', page: 'logs' as const },
  { to: '/admin/reconciliation', label: 'Reconciliation', page: 'reconciliation' as const },
  { to: '/admin/settings', label: 'Settings', page: 'settings' as const },
] as const

/**
 * Maps `/admin` and `/admin/...` paths to a known {@link AdminPageKey}, or `null` if unknown.
 */
export function pathnameToAdminPageKey(pathname: string): AdminPageKey | null {
  const n = pathname.replace(/\/$/, '') || '/'
  if (n === '/admin') return 'dashboard'
  if (!n.startsWith('/admin')) return null
  const seg = n.slice('/admin'.length).replace(/^\//, '').split('/')[0]
  if (!seg) return 'dashboard'
  return KEY_SET.has(seg) ? (seg as AdminPageKey) : null
}
