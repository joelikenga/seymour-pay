import { useMemo, useState } from 'react'
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

function sortNewestFirst(rows: AuditLogEntry[]): AuditLogEntry[] {
  return [...rows].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
}

export default function LogsPage() {
  const { logs } = useAdminData()
  const [openSectionId, setOpenSectionId] = useState<string | null>('today')

  const baseFiltered = logs

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
            section per calendar day (Lagos).
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5">
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
