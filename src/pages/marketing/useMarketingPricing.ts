import { useQuery } from '@tanstack/react-query'
import {
  MARKETING_PRICING_CACHE_TTL_MS,
  readMarketingPricingCache,
  writeMarketingPricingCache,
} from '../../lib/marketingPricingCache'
import { staticMarketingPricingFallback } from '../../lib/normalizeMarketingPricing'
import { getMarketingVehicleRates } from '../../utils/api/services/marketingPricingApi'

export const marketingVehicleRatesQueryKey = ['marketing', 'vehicle-rates'] as const

const cachedEntry = readMarketingPricingCache()

/** Live car-park rate cards for marketing pages (Home, Pay info). */
export function useMarketingPricingQuery() {
  return useQuery({
    queryKey: marketingVehicleRatesQueryKey,
    queryFn: async ({ signal }) => {
      try {
        const data = await getMarketingVehicleRates(signal)
        writeMarketingPricingCache(data)
        return data
      } catch {
        const cached = readMarketingPricingCache()
        if (cached) return cached.data
        return staticMarketingPricingFallback()
      }
    },
    initialData: cachedEntry?.data,
    initialDataUpdatedAt: cachedEntry?.savedAt,
    staleTime: MARKETING_PRICING_CACHE_TTL_MS,
    refetchInterval: MARKETING_PRICING_CACHE_TTL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}
