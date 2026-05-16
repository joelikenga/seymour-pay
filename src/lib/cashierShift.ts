export type CashierShift = 1 | 2 | 3

export type ShiftFilterValue = 'all' | `${CashierShift}`

export const SHIFT_FILTER_OPTIONS: { value: ShiftFilterValue; label: string }[] = [
  { value: 'all', label: 'All shifts' },
  { value: '1', label: 'Shift 1' },
  { value: '2', label: 'Shift 2' },
  { value: '3', label: 'Shift 3' },
]

export function labelForShiftFilter(value: ShiftFilterValue): string {
  return SHIFT_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? 'All shifts'
}

export function parseShiftFilter(value: string): ShiftFilterValue {
  if (value === '1' || value === '2' || value === '3') return value
  return 'all'
}

export function shiftFilterToApi(
  value: ShiftFilterValue,
): CashierShift | undefined {
  if (value === 'all') return undefined
  return Number(value) as CashierShift
}

/** Shift windows (local time): 06:00–13:59, 14:00–21:59, 22:00–05:59 */
export function shiftFromHour(hour: number): CashierShift {
  if (hour >= 6 && hour < 14) return 1
  if (hour >= 14 && hour < 22) return 2
  return 3
}

export function shiftFromIso(iso: string): CashierShift {
  const h = new Date(iso).getHours()
  return shiftFromHour(h)
}

export function parseCashierShift(raw: unknown): CashierShift | null {
  if (raw === 1 || raw === '1' || raw === 'shift_1' || raw === 'shift1') return 1
  if (raw === 2 || raw === '2' || raw === 'shift_2' || raw === 'shift2') return 2
  if (raw === 3 || raw === '3' || raw === 'shift_3' || raw === 'shift3') return 3
  return null
}

export function shiftLabel(shift: CashierShift): string {
  return `Shift ${shift}`
}
