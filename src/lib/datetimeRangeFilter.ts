/** Preset keys for cashier drill-down datetime filter. */
export type DatetimeFilterPreset =
  | 'all'
  | 'today'
  | '7d'
  | '30d'
  | 'custom'

export type DatetimeFilterSelection =
  | { kind: 'all' }
  | { kind: 'today' }
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: 'custom'; start: string; end: string }

/** `datetime-local` value → ISO string for API. */
export function datetimeLocalToIso(local: string): string | undefined {
  const t = local.trim()
  if (!t) return undefined
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Bounds for API `from_datetime` / `to_datetime` (ISO). */
export function datetimeSelectionToApiRange(
  selection: DatetimeFilterSelection,
  now: Date = new Date(),
): { from_datetime?: string; to_datetime?: string } {
  if (selection.kind === 'all') return {}
  if (selection.kind === 'custom') {
    const from = datetimeLocalToIso(selection.start)
    const to = datetimeLocalToIso(selection.end)
    if (!from || !to) return {}
    return { from_datetime: from, to_datetime: to }
  }
  const end = endOfLocalDay(now)
  const start = startOfLocalDay(now)
  if (selection.kind === '7d') {
    start.setDate(start.getDate() - 6)
  } else if (selection.kind === '30d') {
    start.setDate(start.getDate() - 29)
  }
  return {
    from_datetime: start.toISOString(),
    to_datetime: end.toISOString(),
  }
}

export function parseDatetimeFilterValue(
  value: string,
  customStart: string,
  customEnd: string,
): DatetimeFilterSelection {
  if (value === 'today') return { kind: 'today' }
  if (value === '7d') return { kind: '7d' }
  if (value === '30d') return { kind: '30d' }
  if (value === 'custom' && customStart.trim() && customEnd.trim()) {
    return { kind: 'custom', start: customStart.trim(), end: customEnd.trim() }
  }
  return { kind: 'all' }
}

export function labelForDatetimeFilter(
  value: string,
  customStart: string,
  customEnd: string,
): string {
  if (value === 'all') return 'All time'
  if (value === 'today') return 'Today'
  if (value === '7d') return 'Last 7 days'
  if (value === '30d') return 'Last 30 days'
  if (value === 'custom') {
    if (!customStart || !customEnd) return 'Custom range (set date & time)'
    return `${customStart.replace('T', ' ')} → ${customEnd.replace('T', ' ')}`
  }
  return 'All time'
}
