/**
 * Normalized admin session profile (`GET /admin/auth/me`).
 * Raw fields may be snake_case or camelCase; see {@link normalizeAdminProfile}.
 */
export interface AdminProfile {
  raw: Record<string, unknown>
  id?: string | number
  email: string
  firstName: string
  lastName: string
  /** Best display name derived from API fields. */
  displayName: string
  initials: string
  phone?: string
  photoUrl?: string
}
