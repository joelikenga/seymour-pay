import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { AnalyticsOverviewResponse } from '../types/analyticsOverview'
import {
  adminGetAnalytics,
  type AdminGetAnalyticsParams,
} from '../utils/api/services/analyticsApi'

export function analyticsOverviewQueryKey(
  params: AdminGetAnalyticsParams,
): readonly unknown[] {
  return [
    'admin',
    'analytics',
    'overview',
    params.from ?? '',
    params.to ?? '',
    params.channel ?? '',
    params.status ?? '',
  ] as const
}

export function useAnalyticsOverviewQuery(
  params: AdminGetAnalyticsParams,
  options: { enabled?: boolean } = {},
): UseQueryResult<AnalyticsOverviewResponse, Error> {
  const { enabled = true } = options
  return useQuery({
    queryKey: analyticsOverviewQueryKey(params),
    queryFn: () => adminGetAnalytics(params),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}
