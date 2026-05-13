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

function base64UrlPayload(payloadSegment: string): Record<string, unknown> | null {
  try {
    let b64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) b64 += '='.repeat(4 - pad)
    const json = atob(b64)
    const parsed = JSON.parse(json) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** Seconds until JWT `exp`, if present and in the future. */
export function secondsUntilJwtExpiry(token: string): number | undefined {
  const parts = token.split('.')
  if (parts.length < 2) return undefined
  const payload = base64UrlPayload(parts[1])
  const exp = payload?.exp
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return undefined
  const now = Math.floor(Date.now() / 1000)
  const delta = exp - now
  return delta > 0 ? delta : undefined
}

/**
 * OAuth-style `expires_in` / `expiresIn` from the login body, or seconds until JWT `exp`
 * when a bearer token is passed and the body omits expiry.
 */
export function extractTokenExpirySeconds(
  body: unknown,
  bearerToken?: string | null,
): number | undefined {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>
    const n = o.expires_in ?? o.expiresIn
    if (typeof n === 'number' && Number.isFinite(n)) return n
    const nested = nestedExpiry(o.data)
    if (nested !== undefined) return nested
  }
  if (bearerToken) return secondsUntilJwtExpiry(bearerToken)
  return undefined
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
