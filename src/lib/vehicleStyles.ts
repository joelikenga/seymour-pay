import type { VehicleType } from '../types/transaction'

export const VEHICLE_TYPES: VehicleType[] = [
  'car',
  'small_suv',
  'big_suv',
  'bus',
  'coaster',
]

export const vehicleLabel: Record<VehicleType, string> = {
  car: 'Cars',
  small_suv: 'Small SUV',
  big_suv: 'Big SUV',
  bus: 'Bus',
  coaster: 'Coaster',
}

export const vehiclePillClass: Record<VehicleType, string> = {
  car: 'bg-blue-50 text-blue-900 ring-blue-600/15',
  small_suv: 'bg-cyan-50 text-cyan-900 ring-cyan-600/15',
  big_suv: 'bg-indigo-50 text-indigo-900 ring-indigo-600/15',
  bus: 'bg-amber-50 text-amber-900 ring-amber-600/15',
  coaster: 'bg-stone-50 text-stone-900 ring-stone-600/15',
}

/**
 * Car-park tariff per vehicle class.
 *  - `defaultRate` covers the base ticket window.
 *  - `extraHourRate` is the per-hour overage charged after the base window.
 * All amounts are in Nigerian Naira (₦).
 */
export const vehicleParkingRates: Record<
  VehicleType,
  { defaultRate: number; extraHourRate: number }
> = {
  car: { defaultRate: 1500, extraHourRate: 500 },
  small_suv: { defaultRate: 2000, extraHourRate: 600 },
  big_suv: { defaultRate: 2500, extraHourRate: 800 },
  bus: { defaultRate: 3500, extraHourRate: 1000 },
  coaster: { defaultRate: 4500, extraHourRate: 1200 },
}
