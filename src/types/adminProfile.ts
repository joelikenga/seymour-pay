/**
 * Normalized admin session profile (`GET /admin/auth/me`).
 * Raw fields may be snake_case or camelCase; see {@link normalizeAdminProfile}.
 */
import type { AdminPageKey } from './adminUser'

export interface AdminProfile {
  raw: Record<string, unknown>
  id?: string | number
  email: string
  firstName: string
  lastName: string
  /** Best display name derived from API fields. */
  displayName: string
  initials: string
  /** Server role, e.g. `superadmin`. */
  role: string
  /** Which admin routes this user may use (from API `pageAccess` / `page_access`). */
  pageAccess: Record<AdminPageKey, boolean>
  phone?: string
  photoUrl?: string
}
