/** Nigerian operations baseline - West Africa Time (UTC+1, no DST). */
export const DISPLAY_TIMEZONE = 'Africa/Lagos'

export function formatMoney(n: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

/** Integer counts for tables and cards (e.g. 289,202). */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return Math.round(n).toLocaleString('en-NG')
}

/**
 * Currency that fits narrow tiles: full amount under ₦10k, otherwise abbreviated
 * (same rules as {@link formatMoneyAbbreviated}).
 */
export function formatMoneyCompact(n: number, currency = 'NGN'): string {
  if (!Number.isFinite(n)) return 'N/A'
  if (Math.abs(n) < 10_000) return formatMoney(n, currency)
  return formatMoneyAbbreviated(n)
}

/** Share of volume (0–100), keeping one decimal when the API sends it (e.g. 53.4%). */
export function formatSharePct(pct: number): string {
  if (!Number.isFinite(pct)) return '0%'
  const rounded = Math.round(pct * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

/**
 * Short Naira (K / M / B) for the **Dashboard overview hero only** - carousel
 * headline and the four period stat tiles. Do **not** use in tables, exports,
 * or other pages; use {@link formatMoney} there.
 *
 * Uses a space before the unit (e.g. `₦20 K`, `₦200 M`, `₦4 M +`). Appends
 * ` +` when the remainder is material (see implementation).
 */
export function formatMoneyAbbreviated(n: number): string {
  if (!Number.isFinite(n)) return 'N/A'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs < 1000) return formatMoney(n)

  /** Meaningful tail: ≥0.5% of total, or at least ₦100 and ≥0.05% of total. */
  const relPlus = (remainder: number, total: number) =>
    remainder > 0 &&
    (remainder / total >= 0.005 ||
      remainder >= Math.max(100, Math.floor(total * 0.0005)))

  if (abs < 1_000_000) {
    const k = Math.floor(abs / 1000)
    const remainder = abs - k * 1000
    const plus = relPlus(remainder, abs) ? ' +' : ''
    return `${sign}₦${k} K${plus}`
  }
  if (abs < 1_000_000_000) {
    const m = Math.floor(abs / 1_000_000)
    const remainder = abs - m * 1_000_000
    const plus = relPlus(remainder, abs) ? ' +' : ''
    return `${sign}₦${m} M${plus}`
  }
  const b = Math.floor(abs / 1_000_000_000)
  const remainder = abs - b * 1_000_000_000
  const plus = relPlus(remainder, abs) ? ' +' : ''
  return `${sign}₦${b} B${plus}`
}

/** Client ticket flow (Figma) - USD display. */
export function formatUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Placeholder when a ledger timestamp is missing. */
export const TRANSACTION_LEDGER_TIME_EMPTY = '--/--/---- --:--:--' as const

/**
 * Ledger table timestamps: `DD/MM/YYYY HH:MM:SS` (24-hour, Lagos).
 * Returns {@link TRANSACTION_LEDGER_TIME_EMPTY} when the value is null or invalid.
 */
export function formatTransactionLedgerTime(
  iso: string | null | undefined,
): string {
  if (!iso?.trim()) return TRANSACTION_LEDGER_TIME_EMPTY
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return TRANSACTION_LEDGER_TIME_EMPTY

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`
}

/** Non-empty ledger text fields; hyphen when blank. */
export function displayTransactionField(value: string | null | undefined): string {
  const v = value?.trim()
  return v ? v : '-'
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

/** Time only (Lagos) - for compact log timelines. */
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
