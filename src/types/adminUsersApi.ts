import type { AdminPageKey } from './adminUser'

/** `pageAccess` as returned by admin user APIs (may omit keys). */
export type AdminUserPageAccessApi = Partial<Record<AdminPageKey, boolean>>

export interface AdminUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  pageAccess: AdminUserPageAccessApi
}

export interface AdminCreateUserResponse {
  password: string
  user: AdminUserResponse
}

export interface AdminDeleteUserResponse {
  message: string
}
