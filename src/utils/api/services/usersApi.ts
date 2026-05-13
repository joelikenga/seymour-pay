import { axios$ } from '../..'
import {
  initialAdminAccountPageAccess,
  type AdminPageKey,
} from '../../../types/adminUser'
import type {
  AdminCreateUserResponse,
  AdminDeleteUserResponse,
  AdminUserResponse,
} from '../../../types/adminUsersApi'

export type AdminCreateUserBody = {
  email: string
  firstName: string
  lastName: string
}

function assertUserArray(data: unknown): AdminUserResponse[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid users list from server.')
  }
  return data as AdminUserResponse[]
}

/** Response body (axios instance returns `data` from the interceptor). */
function asBody<T>(data: unknown): T {
  return data as T
}

/** `GET /admin/users` — array of users with `pageAccess` (new accounts: dashboard & transactions only). */
export async function adminGetUsers(): Promise<AdminUserResponse[]> {
  const data = await axios$.get('/admin/users')
  return assertUserArray(asBody<unknown>(data))
}

export async function adminGetUserById(id: string): Promise<AdminUserResponse> {
  const data = await axios$.get(`/admin/users/${encodeURIComponent(id)}`)
  return asBody<AdminUserResponse>(data)
}

/** `DELETE /admin/users/:id` — `{ message: "ok" }`. */
export async function adminDeleteUserById(
  id: string,
): Promise<AdminDeleteUserResponse> {
  const data = await axios$.delete(`/admin/users/${encodeURIComponent(id)}`)
  return asBody<AdminDeleteUserResponse>(data)
}

/**
 * `POST /admin/users` — email, firstName, lastName, and `pageAccess` (dashboard + transactions only for new accounts).
 * Response: `{ password, user }`.
 */
export async function adminCreateUser(
  body: AdminCreateUserBody,
): Promise<AdminCreateUserResponse> {
  const data = await axios$.post('/admin/users', {
    email: body.email.trim(),
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    pageAccess: initialAdminAccountPageAccess(),
  })
  return asBody<AdminCreateUserResponse>(data)
}

/**
 * `PATCH /admin/users/:id/page-access` — body `{ pageAccess: { ... } }` with the full map.
 * Response: updated user object.
 */
export async function adminUpdateUserById(
  id: string,
  pageAccess: Record<AdminPageKey, boolean>,
): Promise<AdminUserResponse> {
  const data = await axios$.patch(
    `/admin/users/${encodeURIComponent(id)}/page-access`,
    { pageAccess },
  )
  return asBody<AdminUserResponse>(data)
}