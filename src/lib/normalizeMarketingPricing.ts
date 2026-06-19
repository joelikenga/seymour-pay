import { normalizeVehicleType } from './normalizeTransaction'
import type { MarketingPricingRow, MarketingPricingResponse } from '../types/marketingPricing'
import { VEHICLE_TYPES, vehicleParkingRates } from './vehicleStyles'

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const x = Number(v)
    if (Number.isFinite(x)) return x
  }
  return fallback
}

export function staticMarketingPricingFallback(): MarketingPricingResponse {
  return {
    currency: 'NGN',
    fromApi: false,
    rows: VEHICLE_TYPES.map((vehicleType) => ({
      vehicleType,
      defaultRate: vehicleParkingRates[vehicleType].defaultRate,
      extraHourRate: vehicleParkingRates[vehicleType].extraHourRate,
    })),
  }
}

function mapVehicleRateRow(row: unknown): MarketingPricingRow | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  const r = row as Record<string, unknown>
  const vehicleType = normalizeVehicleType(r.vehicle_type ?? r.vehicleType)
  const defaultRate = num(r.amount ?? r.default_rate ?? r.defaultRate)
  const extraHourRate = num(r.extra_charge ?? r.extraCharge ?? r.extra_hour_rate)
  if (defaultRate <= 0 && extraHourRate <= 0) return null
  return {
    vehicleType,
    defaultRate: defaultRate > 0 ? defaultRate : vehicleParkingRates[vehicleType].defaultRate,
    extraHourRate:
      extraHourRate > 0 ? extraHourRate : vehicleParkingRates[vehicleType].extraHourRate,
  }
}

/**
 * Normalizes marketing `GET /vehicle-rates` JSON.
 * Used on marketing pages only; admin dashboard uses `/admin/analytics/dashboard`.
 */
export function normalizeMarketingVehicleRates(raw: unknown): MarketingPricingResponse {
  const list = Array.isArray(raw) ? raw : []
  const mapped = list
    .map(mapVehicleRateRow)
    .filter((row): row is MarketingPricingRow => row != null)

  if (mapped.length === 0) return staticMarketingPricingFallback()

  const byType = new Map(mapped.map((row) => [row.vehicleType, row]))
  const rows = VEHICLE_TYPES.map((vehicleType) => {
    const fromApi = byType.get(vehicleType)
    if (fromApi) return fromApi
    return {
      vehicleType,
      defaultRate: vehicleParkingRates[vehicleType].defaultRate,
      extraHourRate: vehicleParkingRates[vehicleType].extraHourRate,
    }
  })

  return { rows, currency: 'NGN', fromApi: true }
}
