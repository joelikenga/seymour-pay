import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { normalizeAdminProfile } from '../lib/normalizeAdminProfile'
import type { AdminProfile } from '../types/adminProfile'
import { AuthApi } from '../utils'
import { hasAdminToken } from '../utils/cookies'

export const adminProfileQueryKey = ['admin', 'auth', 'me'] as const

const PROFILE_REFETCH_MS = 45_000

/**
 * Current admin profile — refetches on an interval and when the window regains focus
 * so UI stays in sync when details change on the server.
 */
export function useAdminProfileQuery(): UseQueryResult<AdminProfile | null, Error> {
  return useQuery({
    queryKey: adminProfileQueryKey,
    enabled: hasAdminToken(),
    queryFn: async () => {
      const data = await AuthApi.adminGetCurrentProfile()
      return normalizeAdminProfile(data)
    },
    staleTime: 15_000,
    refetchInterval: PROFILE_REFETCH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
}
