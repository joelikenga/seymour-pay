import type { VehicleType } from './transaction'

/** One row from marketing `GET /vehicle-rates` (`amount` / `extra_charge`). */
export type MarketingPricingRow = {
  vehicleType: VehicleType
  defaultRate: number
  extraHourRate: number
}

export type MarketingPricingResponse = {
  rows: MarketingPricingRow[]
  currency: string
  /** When true, rows came from `/vehicle-rates`; otherwise static fallback. */
  fromApi: boolean
}
