import type { VehicleType } from '../types/transaction'
import { vehicleLabel, vehicleParkingRates } from './vehicleStyles'

/** Demo overstay hours applied after the exit window ends. */
export const DEMO_EXTRA_HOURS = 4

export type PayExtraChargeQuote = {
  extraHours: number
  extraHourRate: number
  amountDue: number
  durationLabel: string
  vehicleType: VehicleType
}

function vehicleClassToType(vehicleClass: string): VehicleType {
  const lower = vehicleClass.toLowerCase()
  if (lower.includes('coaster')) return 'coaster'
  if (lower.includes('bus')) return 'bus'
  if (lower.includes('big')) return 'big_suv'
  if (lower.includes('suv')) return 'small_suv'
  return 'car'
}

export function computePayExtraCharges(vehicleClass: string): PayExtraChargeQuote {
  const vehicleType = vehicleClassToType(vehicleClass)
  const { extraHourRate } = vehicleParkingRates[vehicleType]
  const extraHours = DEMO_EXTRA_HOURS
  return {
    extraHours,
    extraHourRate,
    amountDue: extraHours * extraHourRate,
    durationLabel: `${extraHours}h overstay`,
    vehicleType,
  }
}

export function vehicleClassLabel(type: VehicleType): string {
  return vehicleLabel[type]
}
