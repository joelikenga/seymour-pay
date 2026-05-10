import { Logout } from './api/services/authApi'
import { removeAdminToken, removeAdminUser, removeToken } from './cookies'
import { queryClient } from '../query/queryClient'

function pickTokenString(x: unknown): string | null {
  return typeof x === 'string' && x.length > 0 ? x : null
}

/** Supports common API shapes for `/admin/auth/login` response bodies. */
export function extractAdminLoginToken(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const direct =
    pickTokenString(o.access_token) ??
    pickTokenString(o.token) ??
    pickTokenString(o.accessToken) ??
    pickTokenString((o as { jwt?: unknown }).jwt)
  if (direct) return direct
  const nested = o.data
  if (nested && typeof nested === 'object') {
    const d = nested as Record<string, unknown>
    return (
      pickTokenString(d.access_token) ??
      pickTokenString(d.token) ??
      pickTokenString(d.accessToken) ??
      null
    )
  }
  return null
}

export function extractTokenExpirySeconds(body: unknown): number | undefined {
  if (!body || typeof body !== 'object') return undefined
  const o = body as Record<string, unknown>
  const n = o.expires_in ?? o.expiresIn
  if (typeof n === 'number' && Number.isFinite(n)) return n
  return nestedExpiry(o.data)
}

function nestedExpiry(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined
  const n = (data as Record<string, unknown>).expires_in
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

export async function performAdminLogout(): Promise<void> {
  try {
    await Logout()
  } catch {
    /* still clear local session */
  }
  removeAdminToken()
  removeToken()
  removeAdminUser()
  queryClient.clear()
}
