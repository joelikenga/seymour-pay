import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { LogsApi } from '../utils'
import type { AdminLogsPaginatedResponse } from '../types/adminLogs'

export const LOG_PAGE_SIZE = 50

export const adminLogsInfiniteQueryKey = ['admin', 'logs', 'infinite'] as const

export function useAdminLogsInfiniteQuery(): UseInfiniteQueryResult<
  InfiniteData<AdminLogsPaginatedResponse>,
  Error
> {
  return useInfiniteQuery<
    AdminLogsPaginatedResponse,
    Error,
    InfiniteData<AdminLogsPaginatedResponse>,
    typeof adminLogsInfiniteQueryKey,
    number
  >({
    queryKey: adminLogsInfiniteQueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return LogsApi.adminGetLogs({
        page: pageParam as number,
        page_size: LOG_PAGE_SIZE,
      })
    },
    getNextPageParam: (lastPage) => {
      const pageSize = lastPage.page_size || LOG_PAGE_SIZE
      const inferredPages =
        lastPage.total_pages ??
        (lastPage.total > 0 && pageSize > 0
          ? Math.ceil(lastPage.total / pageSize)
          : 0)
      const totalPages = inferredPages
      if (totalPages <= 0) return undefined
      const next = lastPage.page + 1
      return next < totalPages ? next : undefined
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
