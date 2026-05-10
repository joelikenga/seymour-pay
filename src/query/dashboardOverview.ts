import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { mapOverviewToDashboardStats } from '../lib/mapOverviewToDashboardStats'
import type { OverviewDashboardStats } from '../lib/dashboardStats'
import { OverviewApi } from '../utils'

export const dashboardOverviewQueryKey = ['admin', 'analytics', 'dashboard'] as const

export function useDashboardOverviewQuery(): UseQueryResult<
  OverviewDashboardStats,
  Error
> {
  return useQuery({
    queryKey: dashboardOverviewQueryKey,
    queryFn: async () => {
      const data = await OverviewApi.adminGetOverview()
      return mapOverviewToDashboardStats(data)
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    /** Keeps overview charts in sync while the tab stays open */
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  })
}
