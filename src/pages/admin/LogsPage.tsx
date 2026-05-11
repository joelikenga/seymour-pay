import { useEffect, useMemo, useRef, useState } from 'react'
import AdminPagination from '../../components/admin/AdminPagination'
import type { AuditAction } from '../../types/auditLog'
import type { AdminLogRecord } from '../../types/adminLogs'
import {
  distinctLagosDatesDescending,
  formatLagosYmdHeading,
  lagosTodayYmd,
  lagosYesterdayYmd,
  logMatchesLagosYmd,
} from '../../lib/logDatePreset'
import { formatDateShort, formatTimeOnly } from '../../lib/formatters'
import { useAdminLogsInfiniteQuery } from '../../query/adminLogs'

/** Pagination steps through Lagos calendar days (newest first), not raw API rows. */
const DAYS_PER_PAGE = 10

const DOT_HEX: Record<string, string> = {
  navigation: '#0ea5e9',
  login: '#10b981',
  export: '#f97316',
  reconciliation: '#8b5cf6',
  settings: '#71717a',
}

function badgeClass(action: string): string {
  switch (action as AuditAction) {
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

function sortNewestFirst(rows: AdminLogRecord[]): AdminLogRecord[] {
  return [...rows].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
}

function dedupeById(rows: AdminLogRecord[]): AdminLogRecord[] {
  const seen = new Set<string>()
  const out: AdminLogRecord[] = []
  for (const row of rows) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    out.push(row)
  }
  return out
}

function LogsListSkeleton() {
  return (
    <div className="space-y-3 px-2 py-4 sm:px-4" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex gap-3 sm:gap-4">
          <div className="w-24 shrink-0 space-y-2 sm:w-32">
            <div className="ml-auto h-4 w-14 animate-pulse rounded bg-zinc-200/90" />
            <div className="ml-auto h-3 w-20 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="min-w-0 flex-1 space-y-2 border-l-2 border-zinc-100 pl-4">
            <div className="flex gap-2">
              <div className="h-5 w-24 animate-pulse rounded-md bg-zinc-200/80" />
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="h-4 w-[min(100%,20rem)] animate-pulse rounded bg-zinc-200/70" />
            <div className="h-3 w-full max-w-lg animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LogsPage() {
  const logsQuery = useAdminLogsInfiniteQuery()
  const [dayPageIndex, setDayPageIndex] = useState(0)
  const [openSectionId, setOpenSectionId] = useState<string | null>('today')

  const logsQueryRef = useRef(logsQuery)
  logsQueryRef.current = logsQuery

  const allRows = useMemo(() => {
    const pages = logsQuery.data?.pages ?? []
    return dedupeById(pages.flatMap((p) => p.data ?? []))
  }, [logsQuery.data])

  const distinctYmds = useMemo(
    () => distinctLagosDatesDescending(allRows),
    [allRows],
  )
  const totalDistinctDays = distinctYmds.length

  const now = new Date()
  const todayYmd = lagosTodayYmd(now)
  const yesterdayYmd = lagosYesterdayYmd(now)

  const windowYmds = useMemo(() => {
    const start = dayPageIndex * DAYS_PER_PAGE
    return distinctYmds.slice(start, start + DAYS_PER_PAGE)
  }, [distinctYmds, dayPageIndex])

  const daySections = useMemo(() => {
    return windowYmds.map((ymd) => ({
      id:
        ymd === todayYmd ? 'today' : ymd === yesterdayYmd ? 'yesterday' : ymd,
      label:
        ymd === todayYmd
          ? 'Today'
          : ymd === yesterdayYmd
            ? 'Yesterday'
            : formatLagosYmdHeading(ymd),
      rows: sortNewestFirst(
        allRows.filter((row) => logMatchesLagosYmd(row.at, ymd)),
      ),
    }))
  }, [allRows, windowYmds, todayYmd, yesterdayYmd])

  const uiDayPage = dayPageIndex + 1

  /** While more API pages may exist, pad so page N can represent “days” ranks up to N×pageSize. */
  const pagerTotalItems = logsQuery.hasNextPage
    ? Math.max(totalDistinctDays, uiDayPage * DAYS_PER_PAGE)
    : totalDistinctDays

  const filledDayPages = Math.max(
    1,
    Math.ceil(Math.max(totalDistinctDays, 1) / DAYS_PER_PAGE),
  )
  const totalDayPages = logsQuery.hasNextPage
    ? Math.max(filledDayPages, dayPageIndex + 2)
    : filledDayPages

  useEffect(() => {
    if (!logsQuery.hasNextPage) {
      const maxIdx = Math.max(
        0,
        Math.ceil(totalDistinctDays / DAYS_PER_PAGE) - 1,
      )
      if (totalDistinctDays > 0 && dayPageIndex > maxIdx) {
        setDayPageIndex(maxIdx)
      }
    }
  }, [logsQuery.hasNextPage, totalDistinctDays, dayPageIndex])

  useEffect(() => {
    setOpenSectionId((cur) => {
      if (daySections.length === 0) return cur
      if (cur && daySections.some((s) => s.id === cur)) return cur
      return daySections[0]?.id ?? null
    })
  }, [daySections])

  useEffect(() => {
    let cancelled = false
    const neededDistinct = (dayPageIndex + 1) * DAYS_PER_PAGE

    const run = async () => {
      while (!cancelled) {
        const q = logsQueryRef.current
        if (!q.hasNextPage || q.isPending) break
        const merged = dedupeById(
          (q.data?.pages ?? []).flatMap((p) => p.data ?? []),
        )
        if (distinctLagosDatesDescending(merged).length >= neededDistinct) break
        if (q.isFetchingNextPage) {
          await new Promise((r) => setTimeout(r, 50))
          continue
        }
        await q.fetchNextPage()
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [dayPageIndex, logsQuery.data?.pages, logsQuery.hasNextPage])

  const loadingOlderDays =
    logsQuery.hasNextPage &&
    totalDistinctDays < (dayPageIndex + 1) * DAYS_PER_PAGE &&
    logsQuery.isFetchingNextPage

  const showEmpty =
    !logsQuery.isPending &&
    !logsQuery.isError &&
    allRows.length === 0

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
        </div>
      </header>

      {logsQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {logsQuery.error instanceof Error
            ? logsQuery.error.message
            : 'Could not load activity log.'}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5">
        <div className="px-3 py-4 sm:px-5 sm:py-5">
          {logsQuery.isPending ? (
            <LogsListSkeleton />
          ) : showEmpty ? (
            <p className="px-4 py-12 text-center text-sm text-zinc-500 sm:px-6">
              No activity logged yet.
            </p>
          ) : (
            <div className="space-y-2">
              {loadingOlderDays && daySections.length === 0 ? (
                <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-zinc-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-orange-500" />
                  Loading older calendar days…
                </p>
              ) : (
                daySections.map(({ id, label, rows }) => {
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
                            open
                              ? 'rotate-180 border-orange-200 text-orange-700'
                              : ''
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
                        className={
                          open ? 'border-t border-zinc-100 bg-white' : 'hidden'
                        }
                      >
                        {open &&
                          (count === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-zinc-500 sm:px-6">
                              No events in this period.
                            </p>
                          ) : (
                            <ul className="max-h-[min(70vh,520px)] divide-y divide-zinc-100 overflow-y-auto px-2 py-2 sm:px-4">
                              {rows.map((row: AdminLogRecord) => (
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
                                        style={{
                                          backgroundColor:
                                            DOT_HEX[row.action] ?? '#a1a1aa',
                                        }}
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
                })
              )}

              {logsQuery.isFetchingNextPage && daySections.length > 0 ? (
                <p className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-500">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-orange-500" />
                  Loading older days…
                </p>
              ) : null}

              {totalDistinctDays > 0 ? (
                <div className="px-2 pb-2 pt-4 sm:px-4">
                  <AdminPagination
                    page={uiDayPage}
                    totalPages={totalDayPages}
                    totalItems={pagerTotalItems}
                    pageSize={DAYS_PER_PAGE}
                    onPageChange={(p) => setDayPageIndex(p - 1)}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
