import fidelityLogo from '../../assets/Fidelity_Bank_Plc_Main_Logo.svg'

const pulse = 'animate-pulse bg-zinc-200/75'

function Bar({ className = '' }: { className?: string }) {
  return <div className={`rounded-md ${pulse} ${className}`} aria-hidden />
}

/**
 * Placeholder layout matching the dashboard overview (hero + sidebar).
 * Uses the same responsive grids as the loaded dashboard.
 */
export default function DashboardOverviewSkeleton() {
  return (
    <div
      className="grid gap-5 lg:grid-cols-[3fr_2fr] lg:items-stretch"
      aria-busy="true"
      aria-label="Loading dashboard overview"
    >
      <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] ring-1 ring-zinc-950/4 sm:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-200/60 to-transparent"
          aria-hidden
        />
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-6">
          <div className="min-w-0 space-y-4 sm:space-y-5">
            <Bar className="h-3 w-28 sm:w-32" />
            <Bar className="h-10 w-full max-w-[min(100%,20rem)] sm:h-12 sm:max-w-md md:h-14" />
            <Bar className="h-4 w-full max-w-lg" />
            <Bar className="h-4 w-full max-w-md" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Bar className="h-7 w-[4.5rem] rounded-full sm:h-8 sm:w-24" />
              <Bar className="h-7 w-[5.5rem] rounded-full sm:h-8 sm:w-28" />
              <Bar className="h-7 w-20 rounded-full sm:h-8 sm:w-24" />
            </div>
            <div className="mt-2 flex gap-1.5 sm:mt-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Bar key={i} className="h-1.5 w-7 rounded-full sm:w-8" />
              ))}
            </div>
          </div>

          <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2.5 sm:gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/40 p-3.5 ring-1 ring-zinc-100/80 sm:p-4"
              >
                <Bar className="h-2.5 w-12 sm:w-14" />
                <Bar className="mt-2 h-6 w-20 sm:mt-2.5 sm:h-7 sm:w-28 md:h-8 md:w-32" />
                <Bar className="mt-2 h-2.5 w-full max-w-[6rem] sm:max-w-[7rem]" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-100 pt-7">
          <Bar className="h-3 w-44 max-w-[80%]" />
          <Bar className="mt-4 h-3.5 w-full rounded-full" />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <Bar className="h-3 w-24" />
            <Bar className="h-3 w-28" />
            <Bar className="h-3 w-20" />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-zinc-100 pt-8">
          <Bar className="h-11 min-w-[8.5rem] flex-1 rounded-xl sm:flex-none sm:w-40" />
          <Bar className="h-11 min-w-[8.5rem] flex-1 rounded-xl sm:flex-none sm:w-36" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <section className="overflow-hidden rounded-[1.75rem] border border-sky-200/70 bg-linear-to-br from-sky-50/90 via-white to-white p-5 shadow-[0_16px_48px_-36px_rgba(14,165,233,0.28)] ring-1 ring-sky-950/5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-inner ring-1 ring-sky-200/80">
              <img
                src={fidelityLogo}
                alt=""
                aria-hidden
                className="h-full w-full object-contain object-center opacity-80"
              />
            </span>
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Bar className="h-3.5 w-32" />
              <Bar className="h-3 w-full max-w-[14rem]" />
            </div>
          </div>
          <ul className="mt-5 space-y-0 divide-y divide-sky-100/80 rounded-2xl bg-white/60 ring-1 ring-sky-100/80">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-3 sm:py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Bar className="h-2 w-2 shrink-0 rounded-full" />
                  <Bar className="h-3 w-24 max-w-[55%] sm:w-28" />
                </div>
                <Bar className="h-3 w-14 shrink-0" />
              </li>
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-linear-to-br from-white via-zinc-50/50 to-orange-50/25 p-5 ring-1 ring-zinc-950/5 sm:p-6">
          <Bar className="h-3 w-16" />
          <div className="mt-4 flex items-center gap-4">
            <Bar className="h-16 w-16 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-5 w-3/4 max-w-[12rem]" />
              <Bar className="h-4 w-full max-w-[16rem]" />
              <Bar className="h-3 w-2/3 max-w-[10rem]" />
            </div>
          </div>
          <Bar className="mt-5 h-11 w-full rounded-xl" />
        </section>
      </div>
    </div>
  )
}

/** Matches the customer traffic card + chart height. */
export function CustomerTrafficChartSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white p-4 shadow-[0_12px_40px_-32px_rgba(15,23,42,0.2)] ring-1 ring-zinc-950/3 sm:p-6">
      <div className="rounded-2xl bg-linear-to-b from-zinc-50/90 to-white p-3 ring-1 ring-zinc-100 sm:p-4">
        <div className="flex h-[220px] w-full items-end justify-between gap-1 px-1 sm:h-[260px] md:h-[280px] md:gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-md bg-zinc-200/80"
              style={{
                height: `${18 + ((i * 7) % 55)}%`,
                minHeight: '1.5rem',
              }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  )
}
