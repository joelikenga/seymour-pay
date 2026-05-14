import { axios$ } from '../..'
import { normalizeAnalyticsOverview } from '../../../lib/normalizeAnalyticsOverview'
import type { AnalyticsOverviewResponse } from '../../../types/analyticsOverview'
import type { PaymentChannel } from '../../../types/transaction'

export type AdminGetAnalyticsParams = {
  from?: string
  to?: string
  status?: 'completed'
  /** When set, overview is scoped to this payment rail (matches payment-type cards). */
  channel?: PaymentChannel | string
}

function compactParams(
  params?: AdminGetAnalyticsParams,
): Record<string, string> | undefined {
  if (!params) return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    out[k] = String(v)
  }
  return Object.keys(out).length ? out : undefined
}

export const adminGetAnalytics = async (
  params?: AdminGetAnalyticsParams,
): Promise<AnalyticsOverviewResponse> => {
  const data = await axios$.get('/admin/analytics/overview', {
    params: compactParams(params),
  })
  return normalizeAnalyticsOverview(data)
}
