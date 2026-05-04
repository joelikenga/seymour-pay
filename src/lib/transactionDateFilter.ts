export type DateFilterSelection =
  | { kind: 'all' }
  | { kind: 'today' }
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: 'month'; year: number; monthIndex: number }
  | { kind: 'custom'; start: string; end: string }

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function getFilterBounds(
  selection: DateFilterSelection,
  now: Date = new Date(),
): { start: Date; end: Date } | null {
  if (selection.kind === 'all') return null
  if (selection.kind === 'today') {
    return { start: startOfLocalDay(now), end: endOfLocalDay(now) }
  }
  if (selection.kind === '7d') {
    const end = endOfLocalDay(now)
    const start = startOfLocalDay(now)
    start.setDate(start.getDate() - 6)
    return { start, end }
  }
  if (selection.kind === '30d') {
    const end = endOfLocalDay(now)
    const start = startOfLocalDay(now)
    start.setDate(start.getDate() - 29)
    return { start, end }
  }
  if (selection.kind === 'month') {
    const start = new Date(
      selection.year,
      selection.monthIndex,
      1,
      0,
      0,
      0,
      0,
    )
    const end = new Date(
      selection.year,
      selection.monthIndex + 1,
      0,
      23,
      59,
      59,
      999,
    )
    return { start, end }
  }
  if (selection.kind === 'custom') {
    const start = startOfLocalDay(new Date(`${selection.start}T12:00:00`))
    const end = endOfLocalDay(new Date(`${selection.end}T12:00:00`))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
    if (start.getTime() > end.getTime()) return { start: end, end: start }
    return { start, end }
  }
  return null
}

export function transactionInRange(
  createdAt: string,
  bounds: { start: Date; end: Date },
): boolean {
  const t = new Date(createdAt).getTime()
  return t >= bounds.start.getTime() && t <= bounds.end.getTime()
}

export function filterRowsByDateSelection<T extends { createdAt: string }>(
  rows: T[],
  selection: DateFilterSelection,
  now?: Date,
): T[] {
  const bounds = getFilterBounds(selection, now)
  if (!bounds) return rows
  return rows.filter((r) => transactionInRange(r.createdAt, bounds))
}

export interface MonthOption {
  year: number
  monthIndex: number
  value: string
  label: string
}

/**
 * Calendar months from **January** of the earliest relevant year through the
 * current month (inclusive). Each full past year includes Jan–Dec; the current
 * year stops at the present month — matches month-picker grids (Jan → now).
 */
export function monthsThroughCurrent(
  earliestTransaction: Date | null,
  now: Date = new Date(),
): MonthOption[] {
  const endY = now.getFullYear()
  const endM = now.getMonth()
  let startY = endY
  if (earliestTransaction) {
    startY = earliestTransaction.getFullYear()
  }
  if (startY > endY) {
    startY = endY
  }

  const out: MonthOption[] = []
  for (let y = startY; y <= endY; y++) {
    const endMonth = y === endY ? endM : 11
    for (let m = 0; m <= endMonth; m++) {
      const value = `month:${y}-${String(m + 1).padStart(2, '0')}`
      const label = new Date(y, m, 15).toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
      })
      out.push({ year: y, monthIndex: m, value, label })
    }
  }

  if (out.length === 0) {
    const value = `month:${endY}-${String(endM + 1).padStart(2, '0')}`
    const label = new Date(endY, endM, 15).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    })
    out.push({ year: endY, monthIndex: endM, value, label })
  }
  return out
}

export function parseFilterValue(
  value: string,
  customStart: string,
  customEnd: string,
): DateFilterSelection {
  if (value === 'all') return { kind: 'all' }
  if (value === 'today') return { kind: 'today' }
  if (value === '7d') return { kind: '7d' }
  if (value === '30d') return { kind: '30d' }
  if (value === 'custom')
    return { kind: 'custom', start: customStart, end: customEnd }
  if (value.startsWith('month:')) {
    const rest = value.slice('month:'.length)
    const [ys, ms] = rest.split('-').map((x) => Number.parseInt(x, 10))
    if (!Number.isFinite(ys) || !Number.isFinite(ms)) return { kind: 'all' }
    return { kind: 'month', year: ys, monthIndex: ms - 1 }
  }
  return { kind: 'all' }
}

export function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function transactionsToCsv(
  rows: Array<{
    reference: string
    customerName: string
    vehicleType: string
    channel: string
    amount: number
    status: string
    createdAt: string
    notes: string
  }>,
): string {
  const header =
    'reference,customer,vehicle_type,payment_type,amount,status,date,notes'
  const lines = rows.map((t) =>
    [
      escapeCsvCell(t.reference),
      escapeCsvCell(t.customerName),
      escapeCsvCell(t.vehicleType),
      escapeCsvCell(t.channel),
      String(t.amount),
      escapeCsvCell(t.status),
      escapeCsvCell(t.createdAt),
      escapeCsvCell(t.notes ?? ''),
    ].join(','),
  )
  return '\uFEFF' + header + '\n' + lines.join('\n')
}
