const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR
const MINUTES_PER_MONTH = 30 * MINUTES_PER_DAY

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Human-readable duration between entry and preview timestamps. */
export function formatParkingDuration(entryTime: string, previewAt: string): string {
  const start = new Date(entryTime).getTime()
  const end = new Date(previewAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return '—'
  }

  let remaining = Math.floor((end - start) / 60_000)
  const months = Math.floor(remaining / MINUTES_PER_MONTH)
  remaining %= MINUTES_PER_MONTH
  const days = Math.floor(remaining / MINUTES_PER_DAY)
  remaining %= MINUTES_PER_DAY
  const hours = Math.floor(remaining / MINUTES_PER_HOUR)
  const minutes = remaining % MINUTES_PER_HOUR

  const parts: string[] = []
  if (months > 0) parts.push(pluralize(months, 'month', 'months'))
  if (days > 0) parts.push(pluralize(days, 'day', 'days'))
  if (hours > 0) parts.push(pluralize(hours, 'hour', 'hours'))
  if (minutes > 0 || parts.length === 0) {
    parts.push(pluralize(minutes, 'minute', 'minutes'))
  }

  return parts.join(' ')
}

/** API vehicle_type → display label (e.g. `small_suv` → `small suv`). */
export function formatVehicleClassDisplay(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}
