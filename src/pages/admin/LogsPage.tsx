import { useMemo, useState } from 'react'
import TableSearchInput from '../../components/admin/TableSearchInput'
import { useAdminData } from '../../context/AdminDataContext'
import type { AuditAction, AuditLogEntry } from '../../types/auditLog'
import {
  distinctLagosDatesDescending,
  formatLagosYmdHeading,
  lagosTodayYmd,
  lagosYesterdayYmd,
  logMatchesLagosYmd,
} from '../../lib/logDatePreset'
import { formatDateShort, formatTimeOnly } from '../../lib/formatters'

const ACTION_TYPES: AuditAction[] = [
  'navigation',
  'login',
  'export',
  'reconciliation',
  'settings',
]

const ACTIONS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: 'All' },
  ...ACTION_TYPES.map((a) => ({
    value: a,
    label: a.charAt(0).toUpperCase() + a.slice(1),
  })),
]

const SEGMENT_BG: Record<AuditAction, string> = {
  navigation: 'bg-sky-500',
  login: 'bg-emerald-500',
  export: 'bg-orange-500',
  reconciliation: 'bg-violet-500',
  settings: 'bg-zinc-500',
}

const DOT_HEX: Record<AuditAction, string> = {
  navigation: '#0ea5e9',
  login: '#10b981',
  export: '#f97316',
  reconciliation: '#8b5cf6',
  settings: '#71717a',
}

function badgeClass(action: AuditAction): string {
  switch (action) {
    case 'login':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-600/20'
    case 'navigation':
      return 'bg-sky-50 text-sky-900 ring-sky-600/20'
    case 'export':
      return 'bg-orange-50 text-orange-900 ring-orange-600/20'
    case 'reconciliation':
      return 'bg-violet-50 text-violet-900 ring-violet-600/20'
    case 'settings':
      return 'bg-zinc-100 text-zinc-900 ring-zinc-600/15'
    default:
      return 'bg-zinc-50 text-zinc-800 ring-zinc-600/15'
  }
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function logsToCsv(rows: AuditLogEntry[]): string {
  const header = 'when,user,action,summary,detail'
  const lines = rows.map((row) =>
    [
      escapeCsvCell(row.at),
      escapeCsvCell(row.userLabel),
      escapeCsvCell(row.action),
      escapeCsvCell(row.summary),
      escapeCsvCell(row.detail),
    ].join(','),
  )
  return '\uFEFF' + header + '\n' + lines.join('\n')
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function sortNewestFirst(rows: AuditLogEntry[]): AuditLogEntry[] {
  return [...rows].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
}

const MS_24H = 24 * 60 * 60 * 1000

export default function LogsPage() {
  const { logs } = useAdminData()
  const [query, setQuery] = useState('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [openSectionId, setOpenSectionId] = useState<string | null>('today')

  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((row) => {
      if (action && row.action !== action) return false
      if (!q) return true
      const blob = `${row.userLabel} ${row.summary} ${row.detail}`.toLowerCase()
      return blob.includes(q)
    })
  }, [logs, query, action])

  const now = new Date()
  const todayYmd = lagosTodayYmd(now)
  const yesterdayYmd = lagosYesterdayYmd(now)

  const daySections = useMemo(() => {
    const todayRows = sortNewestFirst(
      baseFiltered.filter((row) => logMatchesLagosYmd(row.at, todayYmd)),
    )
    const yesterdayRows = sortNewestFirst(
      baseFiltered.filter((row) => logMatchesLagosYmd(row.at, yesterdayYmd)),
    )
    const restYmds = distinctLagosDatesDescending(baseFiltered).filter(
      (ymd) => ymd !== todayYmd && ymd !== yesterdayYmd,
    )
    const rest = restYmds.map((ymd) => ({
      id: ymd,
      label: formatLagosYmdHeading(ymd),
      rows: sortNewestFirst(
        baseFiltered.filter((row) => logMatchesLagosYmd(row.at, ymd)),
      ),
    }))
    return [
      { id: 'today' as const, label: 'Today', rows: todayRows },
      { id: 'yesterday' as const, label: 'Yesterday', rows: yesterdayRows },
      ...rest,
    ]
  }, [baseFiltered, todayYmd, yesterdayYmd])

  const countsByAction = useMemo(() => {
    const m = new Map<AuditAction, number>()
    for (const a of ACTION_TYPES) m.set(a, 0)
    for (const row of baseFiltered) {
      m.set(row.action, (m.get(row.action) ?? 0) + 1)
    }
    return m
  }, [baseFiltered])

  const totalFiltered = baseFiltered.length
  const denom = totalFiltered || 1

  const last24hCount = useMemo(() => {
    const now = Date.now()
    return baseFiltered.filter(
      (row) => now - new Date(row.at).getTime() <= MS_24H,
    ).length
  }, [baseFiltered])

  const dominantAction = useMemo(() => {
    let best: AuditAction | null = null
    let n = -1
    for (const a of ACTION_TYPES) {
      const c = countsByAction.get(a) ?? 0
      if (c > n) {
        n = c
        best = a
      }
    }
    return best && n > 0 ? { action: best, count: n } : null
  }, [countsByAction])

  function exportFiltered() {
    if (baseFiltered.length === 0) return
    const stamp = new Date().toISOString().slice(0, 10)
    const sorted = sortNewestFirst(baseFiltered)
    downloadCsv(`activity-log-${stamp}.csv`, logsToCsv(sorted))
  }

  function toggleSection(id: string) {
    setOpenSectionId((cur) => (cur === id ? null : id))
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full bg-orange-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
            Audit trail
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Activity log
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            <strong>Today</strong> and <strong>Yesterday</strong> first, then one
            section per calendar day (Lagos). Search and action filters apply
            everywhere; export includes all matching rows.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5">
        <div className="border-b border-zinc-100 bg-linear-to-r from-white to-zinc-50/90 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-zinc-950">Live breakdown</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Search and action filters apply to every period below.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportFiltered}
                disabled={baseFiltered.length === 0}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export CSV ({baseFiltered.length})
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <TableSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search user, summary, detail…"
              ariaLabel="Search log"
            />
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by action"
            >
              {ACTIONS.map((a) => {
                const active = action === a.value
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => setAction(a.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-zinc-950 text-white shadow-md shadow-zinc-900/15'
                        : 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80 hover:bg-zinc-200/70'
                    }`}
                  >
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Mix for current filters
              </p>
              {totalFiltered === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">No events match — loosen filters.</p>
              ) : (
                <>
                  <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/90">
                    {ACTION_TYPES.map((a) => {
                      const n = countsByAction.get(a) ?? 0
                      const pct = (n / denom) * 100
                      if (pct <= 0) return null
                      return (
                        <div
                          key={a}
                          className={`${SEGMENT_BG[a]} min-w-[4px] transition-all first:rounded-l-full last:rounded-r-full`}
                          style={{ width: `${pct}%` }}
                          title={`${a}: ${n}`}
                        />
                      )
                    })}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    {ACTION_TYPES.map((a) => {
                      const n = countsByAction.get(a) ?? 0
                      if (n === 0) return null
                      return (
                        <li key={a} className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${SEGMENT_BG[a]}`}
                          />
                          <span className="font-medium capitalize text-zinc-700">
                            {a}
                          </span>
                          <span className="tabular-nums text-zinc-500">{n}</span>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 ring-1 ring-zinc-950/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Matching filters
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-950">
                {totalFiltered}
              </p>
              <p className="text-xs text-zinc-500">
                Any period ·{' '}
                <span className="font-medium text-zinc-700">{last24hCount}</span> in
                last 24h
              </p>
              {dominantAction ? (
                <p className="mt-3 border-t border-zinc-200/80 pt-3 text-xs text-zinc-600">
                  Most common:{' '}
                  <span className="font-semibold capitalize text-zinc-900">
                    {dominantAction.action}
                  </span>{' '}
                  ({dominantAction.count})
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-3 py-4 sm:px-5 sm:py-5">
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:px-0">
            By period (WAT)
          </p>
          <div className="space-y-2">
            {daySections.map(({ id, label, rows }) => {
              const count = rows.length
              const open = openSectionId === id
              const panelId = `log-period-${id}`
              return (
                <div
                  key={id}
                  className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-50/40 ring-1 ring-zinc-950/5"
                >
                  <button
                    type="button"
                    id={`${panelId}-btn`}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggleSection(id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/80 sm:px-5"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition ${
                        open ? 'rotate-180 border-orange-200 text-orange-700' : ''
                      }`}
                      aria-hidden
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 font-semibold text-zinc-900">
                      {label}
                    </span>
                    <span className="shrink-0 rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-xs font-bold tabular-nums text-zinc-700">
                      {count}
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={`${panelId}-btn`}
                    className={open ? 'border-t border-zinc-100 bg-white' : 'hidden'}
                  >
                    {open &&
                      (count === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-zinc-500 sm:px-6">
                          No events in this period for your filters.
                        </p>
                      ) : (
                        <ul className="max-h-[min(70vh,520px)] divide-y divide-zinc-100 overflow-y-auto px-2 py-2 sm:px-4">
                          {rows.map((row: AuditLogEntry) => (
                            <li key={row.id}>
                              <div className="flex gap-3 py-3.5 sm:gap-4">
                                <div className="flex w-[min(100%,7.5rem)] shrink-0 flex-col items-end gap-0.5 text-right sm:w-32">
                                  <time
                                    dateTime={row.at}
                                    className="text-sm font-bold tabular-nums text-zinc-950"
                                  >
                                    {formatTimeOnly(row.at)}
                                  </time>
                                  <time
                                    dateTime={row.at}
                                    className="text-[11px] tabular-nums text-zinc-500"
                                  >
                                    {formatDateShort(row.at)}
                                  </time>
                                </div>
                                <div className="relative min-w-0 flex-1 border-l-2 border-zinc-200 pl-4">
                                  <span
                                    className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                                    style={{ backgroundColor: DOT_HEX[row.action] }}
                                    aria-hidden
                                  />
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${badgeClass(row.action)}`}
                                    >
                                      {row.action}
                                    </span>
                                    <span className="text-xs font-medium text-zinc-500">
                                      {row.userLabel}
                                    </span>
                                  </div>
                                  <p className="mt-1.5 text-sm font-semibold text-zinc-900">
                                    {row.summary}
                                  </p>
                                  <p className="mt-0.5 text-sm leading-snug text-zinc-600">
                                    {row.detail}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
