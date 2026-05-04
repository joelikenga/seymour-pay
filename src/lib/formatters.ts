/** Nigerian operations baseline — West Africa Time (UTC+1, no DST). */
export const DISPLAY_TIMEZONE = 'Africa/Lagos'

export function formatMoney(n: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

/** Client ticket flow (Figma) — USD display. */
export function formatUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-NG', {
    timeZone: DISPLAY_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDateShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NG', {
    timeZone: DISPLAY_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Time only (Lagos) — for compact log timelines. */
export function formatTimeOnly(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-NG', {
    timeZone: DISPLAY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/** Friendly day stamp for stat cards, e.g. "Sun, 3 May 2026". Accepts YYYY-MM-DD. */
export function formatDayStamp(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Compact YMD range, e.g. "27 Apr – 3 May" or "27 Dec 2025 – 2 Jan 2026" when years differ. */
export function formatYmdRange(startYmd: string, endYmd: string): string {
  const [sy, sm, sd] = startYmd.split('-').map(Number)
  const [ey, em, ed] = endYmd.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const sameYear = sy === ey
  const sameMonth = sameYear && sm === em
  const monthShort = (d: Date) =>
    d.toLocaleDateString('en-NG', { month: 'short' })

  if (sameMonth) {
    return `${sd} – ${ed} ${monthShort(end)} ${ey}`
  }
  if (sameYear) {
    return `${sd} ${monthShort(start)} – ${ed} ${monthShort(end)} ${ey}`
  }
  return `${sd} ${monthShort(start)} ${sy} – ${ed} ${monthShort(end)} ${ey}`
}
