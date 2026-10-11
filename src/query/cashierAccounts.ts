import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { CashierAccount } from '../types/cashierAccount'
import { CashierAccountsApi } from '../utils'
import { hasAdminToken } from '../utils/cookies'

export const cashierAccountsQueryKey = ['admin', 'cashier-accounts'] as const

/**
 * Hook to retrieve all cashier accounts from `GET /admin/cashier-accounts`.
 */
export function useCashierAccountsQuery(
  enabled = true,
): UseQueryResult<CashierAccount[], Error> {
  return useQuery({
    queryKey: cashierAccountsQueryKey,
    queryFn: async () => {
      return CashierAccountsApi.adminGetCashierAccounts()
    },
    enabled: hasAdminToken() && enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}
