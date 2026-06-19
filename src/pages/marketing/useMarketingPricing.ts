import { useQuery } from '@tanstack/react-query'
import { staticMarketingPricingFallback } from '../../lib/normalizeMarketingPricing'
import { getMarketingVehicleRates } from '../../utils/api/services/marketingPricingApi'

export const marketingVehicleRatesQueryKey = ['marketing', 'vehicle-rates'] as const

/** Live car-park rate cards for marketing pages (Home, Pay info). */
export function useMarketingPricingQuery() {
  return useQuery({
    queryKey: marketingVehicleRatesQueryKey,
    queryFn: ({ signal }) => getMarketingVehicleRates(signal),
    placeholderData: staticMarketingPricingFallback(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  })
}
