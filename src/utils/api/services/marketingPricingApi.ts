import {
  normalizeMarketingVehicleRates,
  staticMarketingPricingFallback,
} from '../../../lib/normalizeMarketingPricing'
import type { MarketingPricingResponse } from '../../../types/marketingPricing'
import { axios$ } from '../..'

/**
 * Marketing-site tariffs only (`GET /vehicle-rates`).
 * Do not use for admin dashboard or pay ticket preview; those use other APIs.
 */
export async function getMarketingVehicleRates(
  signal?: AbortSignal,
): Promise<MarketingPricingResponse> {
  try {
    const raw = await axios$.get('/vehicle-rates', { signal })
    return normalizeMarketingVehicleRates(raw)
  } catch {
    return staticMarketingPricingFallback()
  }
}
