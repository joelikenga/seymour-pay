import { useQuery } from '@tanstack/react-query'
import {
  readTransactionCashiersForRange,
  writeTransactionCashiersCache,
} from '../lib/transactionCashiersStorage'
import { TransactionsApi } from '../utils'

export type TransactionCashiersRange = {
  from?: string
  to?: string
}

export function transactionCashiersQueryKey(from: string, to: string) {
  return ['admin', 'cashiers', from, to] as const
}

export function useTransactionCashiersQuery(
  range: TransactionCashiersRange,
  enabled = true,
) {
  const from = range.from?.trim() ?? ''
  const to = range.to?.trim() ?? ''
  const hasRange = Boolean(from && to)

  return useQuery({
    queryKey: transactionCashiersQueryKey(from, to),
    queryFn: async ({ signal }) => {
      const names = await TransactionsApi.adminGetTransactionCashiers(
        { from, to },
        signal,
      )
      writeTransactionCashiersCache({
        from,
        to,
        names,
        updatedAt: new Date().toISOString(),
      })
      return names
    },
    enabled: enabled && hasRange,
    placeholderData: () => readTransactionCashiersForRange(from, to),
    staleTime: 0,
    refetchOnMount: true,
  })
}
