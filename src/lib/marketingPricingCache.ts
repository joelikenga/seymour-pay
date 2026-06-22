import type { MarketingPricingResponse } from '../types/marketingPricing'

const STORAGE_KEY = 'seymour-marketing-vehicle-rates'
export const MARKETING_PRICING_CACHE_TTL_MS = 10 * 60 * 1000

type MarketingPricingCacheEntry = {
  data: MarketingPricingResponse
  savedAt: number
}

function isValidResponse(value: unknown): value is MarketingPricingResponse {
  if (!value || typeof value !== 'object') return false
  const o = value as MarketingPricingResponse
  return Array.isArray(o.rows) && typeof o.currency === 'string'
}

/** Read cached marketing tariffs from localStorage, if present and valid. */
export function readMarketingPricingCache(): MarketingPricingCacheEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MarketingPricingCacheEntry
    if (
      !parsed ||
      typeof parsed.savedAt !== 'number' ||
      !isValidResponse(parsed.data)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/** Persist marketing tariffs and timestamp for offline / instant display. */
export function writeMarketingPricingCache(data: MarketingPricingResponse): void {
  try {
    const entry: MarketingPricingCacheEntry = {
      data,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    // Quota or private mode - ignore; live fetch still works.
  }
}
