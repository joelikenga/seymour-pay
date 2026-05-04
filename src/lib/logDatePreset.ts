import { DISPLAY_TIMEZONE } from './formatters'

/** YYYY-MM-DD for the instant in the Lagos (WAT) calendar. */
export function lagosCalendarYmd(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-CA', { timeZone: DISPLAY_TIMEZONE })
}

export function lagosTodayYmd(now: Date = new Date()): string {
  return lagosCalendarYmd(now)
}

export function lagosYesterdayYmd(now: Date = new Date()): string {
  const todayYmd = lagosTodayYmd(now)
  const startTodayMs = new Date(`${todayYmd}T00:00:00+01:00`).getTime()
  return lagosCalendarYmd(new Date(startTodayMs - 1))
}

export function logMatchesLagosYmd(at: string, ymd: string): boolean {
  return lagosCalendarYmd(at) === ymd
}

/** Unique Lagos days in the set, **newest first** (lexicographic on en-CA works for YYYY-MM-DD). */
export function distinctLagosDatesDescending(
  rows: { at: string }[],
): string[] {
  const set = new Set<string>()
  for (const r of rows) set.add(lagosCalendarYmd(r.at))
  return [...set].sort((a, b) => b.localeCompare(a))
}

/** Accordion label for a YMD, e.g. "Fri, 2 May 2026" in Lagos. */
export function formatLagosYmdHeading(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0)
  return new Date(utcNoon).toLocaleDateString('en-NG', {
    timeZone: DISPLAY_TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
