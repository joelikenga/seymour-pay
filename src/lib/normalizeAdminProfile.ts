import type { AdminProfile } from '../types/adminProfile'
import {
  defaultPageAccess,
  pageAccessFromApi,
  type AdminPageKey,
} from '../types/adminUser'

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === 'object' && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function mergeProfileLayers(body: unknown): Record<string, unknown> {
  const root = asRecord(body)
  if (!root) return {}
  const data = asRecord(root.data)
  const userInData = data ? asRecord(data.user) ?? asRecord(data.admin) : null
  const userRoot = asRecord(root.user) ?? asRecord(root.admin)
  return {
    ...root,
    ...(data ?? {}),
    ...(userInData ?? {}),
    ...(userRoot ?? {}),
  }
}

function pickPageAccessFromSource(src: Record<string, unknown>): Record<
  AdminPageKey,
  boolean
> {
  const pa = src.page_access ?? src.pageAccess
  if (pa && typeof pa === 'object' && !Array.isArray(pa)) {
    return pageAccessFromApi(pa as Partial<Record<AdminPageKey, boolean>>)
  }
  return defaultPageAccess()
}

function initialsFrom(first: string, last: string, fallback: string): string {
  const a = first.slice(0, 1)
  const b = last.slice(0, 1)
  const two = `${a}${b}`.toUpperCase()
  if (two.length >= 2) return two
  const fb = fallback.trim()
  if (fb.length >= 2) return fb.slice(0, 2).toUpperCase()
  if (fb.length === 1) return fb.toUpperCase()
  return '?'
}

/**
 * Maps arbitrary `/admin/auth/me` JSON into {@link AdminProfile}.
 * Safe when the backend adds or renames fields - unknown keys stay in `raw`.
 */
export function normalizeAdminProfile(body: unknown): AdminProfile | null {
  const src = mergeProfileLayers(body)
  if (Object.keys(src).length === 0) return null

  const email = pickString(src, ['email'])
  const firstName = pickString(src, ['first_name', 'firstName', 'firstname'])
  const lastName = pickString(src, ['last_name', 'lastName', 'lastname'])
  const full = pickString(src, ['name', 'full_name', 'fullName', 'display_name', 'displayName'])
  const displayName =
    full ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    email ||
    'Admin'

  const id = src.id ?? src.user_id ?? src.admin_id
  if (
    !email &&
    !full &&
    !firstName &&
    !lastName &&
    (id === undefined || id === null)
  ) {
    return null
  }

  const phone = pickString(src, ['phone', 'phone_number', 'phoneNumber']) || undefined
  const photoUrl =
    pickString(src, ['photo', 'photo_url', 'photoUrl', 'avatar', 'avatar_url', 'avatarUrl', 'picture']) ||
    undefined

  const raw = { ...src }
  const initials = initialsFrom(firstName, lastName, displayName)
  const role = pickString(src, ['role', 'admin_role', 'adminRole'])
  const pageAccess = pickPageAccessFromSource(src)

  return {
    raw,
    id: id as string | number | undefined,
    email: email || '',
    firstName,
    lastName,
    displayName,
    initials,
    role,
    pageAccess,
    phone,
    photoUrl,
  }
}
