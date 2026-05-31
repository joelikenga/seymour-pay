import { useQuery } from '@tanstack/react-query'
import {
  fetchPayTicketById,
  isPayTicketNotFoundError,
} from '../../utils/api/services/ticketPayApi'
import type { PayTicketDetails } from '../../types/ticketPay'

/** Background refresh so amount due stays current while the user is on the page. */
const FEE_PREVIEW_REFETCH_MS = 30_000

export function ticketFeePreviewQueryKey(ticketId: string, extraPay = false) {
  return [
    'pay',
    'ticket-fee-preview',
    ticketId.trim(),
    extraPay ? 'extra' : 'standard',
  ] as const
}

export function usePayTicketLookup(ticketId: string, extraPay = false) {
  const id = ticketId.trim()

  const query = useQuery<PayTicketDetails>({
    queryKey: ticketFeePreviewQueryKey(id, extraPay),
    queryFn: ({ signal }) => fetchPayTicketById(id, { extra: extraPay, signal }),
    enabled: id.length > 0,
    refetchInterval: FEE_PREVIEW_REFETCH_MS,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) =>
      !isPayTicketNotFoundError(error) && failureCount < 1,
  })

  return {
    ticket: query.data ?? null,
    error: query.error ?? null,
    /** True only on the first load — background refetches do not flash the skeleton. */
    loading: query.isPending && query.data === undefined,
  }
}
