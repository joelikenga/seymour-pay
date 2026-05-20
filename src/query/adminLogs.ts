import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { LogsApi } from '../utils'
import type { AdminLogsPaginatedResponse } from '../types/adminLogs'

export const LOG_PAGE_SIZE = 50

/** Prefix for `invalidateQueries` - matches all `['admin', 'logs', …]` query keys. */
export const adminLogsQueryRootKey = ['admin', 'logs'] as const

export const adminLogsInfiniteQueryKey = [
  ...adminLogsQueryRootKey,
  'infinite',
] as const

function totalPagesFromResponse(last: AdminLogsPaginatedResponse): number {
  const pageSize = last.page_size || LOG_PAGE_SIZE
  if (last.total_pages != null && last.total_pages > 0) return last.total_pages
  if (last.total > 0 && pageSize > 0) return Math.ceil(last.total / pageSize)
  return 0
}

/** Loads `/admin/logs` page-by-page; UI paginates merged rows by Lagos calendar day. */
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
      const page = pageParam as number
      return LogsApi.adminGetLogs({
        page,
        page_size: LOG_PAGE_SIZE,
      })
    },
    getNextPageParam: (lastPage) => {
      const totalPages = totalPagesFromResponse(lastPage)
      if (totalPages <= 0) return undefined
      const next = lastPage.page + 1
      return next < totalPages ? next : undefined
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
