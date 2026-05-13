import { toast } from 'sonner'

/** Shown when the server rejects the call for admin-only operations. */
export const ADMIN_ACCESS_DENIED_MESSAGE =
  'Only admins can perform this action.' as const

/**
 * Message thrown by the axios interceptor when there is no HTTP response and
 * `error.code === "ERR_NETWORK"` (offline, CORS, blocked, etc.).
 * Settings may treat this like an access wall when loading `/admin/users`.
 */
export const AXIOS_ERR_NETWORK_USER_MESSAGE =
  'No Internet connection. Please check your internet connection.' as const

/**
 * Detect API copy that indicates the caller lacks admin rights (not generic 500s).
 */
export function messageIndicatesAdminAccessDenied(message: string): boolean {
  const m = message.trim().toLowerCase()
  if (!m) return false
  if (m === ADMIN_ACCESS_DENIED_MESSAGE.toLowerCase()) return true
  if (m.includes('only admins can perform')) return true
  if (/\bnon-?admin\b/.test(m)) return true
  if (/must\s+be\s+(an?\s+)?admin\b/.test(m)) return true
  if (/\bforbidden\b/.test(m) && /\badmin\b/.test(m)) return true
  if (/\badmin\b/.test(m) && /\b(access|privilege|permission|rights?)\b/.test(m))
    return true
  if (/insufficient\s+privileges?/.test(m) && /\badmin\b/.test(m)) return true
  return false
}

/** Used for admin user list / settings UI when the request should not offer Retry. */
export function adminUsersListShowsAccessDenied(message: string | null): boolean {
  if (!message) return false
  if (messageIndicatesAdminAccessDenied(message)) return true
  if (message.trim() === AXIOS_ERR_NETWORK_USER_MESSAGE) return true
  return false
}

/**
 * Human-readable message from thrown API/axios errors (interceptor already maps to `Error`).
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.trim()
    if (m) {
      if (messageIndicatesAdminAccessDenied(m)) {
        return ADMIN_ACCESS_DENIED_MESSAGE
      }
      return m
    }
  }
  if (typeof err === 'string') {
    const m = err.trim()
    if (m) {
      if (messageIndicatesAdminAccessDenied(m)) {
        return ADMIN_ACCESS_DENIED_MESSAGE
      }
      return m
    }
  }
  return 'Something went wrong. Please try again.'
}

/**
 * Standard Sonner error: short title + description from the error (or override).
 * Admin-access denials show a single clear line (no generic “An error occurred” + title).
 */
export function toastRequestFailed(
  title: string,
  err?: unknown,
  options?: { description?: string },
): void {
  const description =
    options?.description ??
    (err !== undefined && err !== null ? getErrorMessage(err) : undefined)

  if (description === ADMIN_ACCESS_DENIED_MESSAGE) {
    toast.error(ADMIN_ACCESS_DENIED_MESSAGE)
    return
  }
  if (description) {
    toast.error(title, { description })
  } else {
    toast.error(title)
  }
}
