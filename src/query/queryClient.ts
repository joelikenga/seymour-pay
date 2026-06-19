import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack client - tuned so admin screens (dashboard, profile, logs, future API tables)
 * pick up server changes when you return to the tab or reconnect.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})

/** All keys under `['admin', …]` inherit live defaults (focus + reconnect refetch). */
queryClient.setQueryDefaults(['admin'], {
  staleTime: 15_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})

/** Pay flow ticket preview - keep amount fresh without UI flicker on refetch. */
queryClient.setQueryDefaults(['pay', 'ticket-fee-preview'], {
  staleTime: 15_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})
