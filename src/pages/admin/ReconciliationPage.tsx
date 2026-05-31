import ReconciliationAlignTab from './reconciliation/ReconciliationAlignTab'

export default function ReconciliationPage() {
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-br from-white via-white to-orange-50/35 p-6 shadow-[0_12px_48px_-28px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700/90">
            Reconciliation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Align every payment type
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            Align, edit, and delete ledger rows across every payment rail.
          </p>
        </div>
      </header>

      <section
        className="min-w-0 overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_8px_40px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-950/5"
        aria-label="Reconciliation workspace"
      >
        <ReconciliationAlignTab />
      </section>
    </div>
  )
}
