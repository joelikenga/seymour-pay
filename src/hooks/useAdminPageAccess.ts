import { useMemo } from 'react'
import { useAdminProfileQuery } from '../query/adminProfile'
import type { AdminPageKey } from '../types/adminUser'

/**
 * Session {@link AdminProfile} and helpers to hide links or UI for pages the user cannot open.
 */
export function useAdminPageAccess() {
  const query = useAdminProfileQuery()
  const profile = query.data

  const canAccess = useMemo(() => {
    return (page: AdminPageKey): boolean => {
      if (!profile) return false
      return Boolean(profile.pageAccess[page])
    }
  }, [profile])

  return {
    ...query,
    profile,
    canAccess,
  }
}
