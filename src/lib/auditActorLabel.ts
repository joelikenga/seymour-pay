import type { AdminProfile } from '../types/adminProfile'
import { adminProfileQueryKey } from '../query/adminProfile'
import { queryClient } from '../query/queryClient'

/** Resolved actor for audit UI + log sentences (profile or fallback). */
export function getAuditActorLabel(): string {
  const me = queryClient.getQueryData<AdminProfile | null>(adminProfileQueryKey)
  if (me?.displayName?.trim()) return me.displayName.trim()
  if (me?.email?.trim()) return me.email.trim()
  return 'Admin'
}
