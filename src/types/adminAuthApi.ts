import type { AdminPageKey } from './adminUser'

/** User object returned with `POST /admin/auth/login`. */
export interface AdminLoginApiUser {
  id: string
  email: string
  first_name: string
  last_name: string
  name: string
  role: string
  pageAccess: Partial<Record<AdminPageKey, boolean>>
}

/** Body from `POST /admin/auth/login`. */
export interface AdminLoginResponse {
  token: string
  user: AdminLoginApiUser
}
