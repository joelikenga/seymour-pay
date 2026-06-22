import { VehicleTypeIconBadge } from '../admin/VehicleTypeGlyph'
import { formatMoney } from '../../lib/formatters'
import { VEHICLE_TYPES, vehicleLabel } from '../../lib/vehicleStyles'
import type { MarketingPricingRow } from '../../types/marketingPricing'

type PricingShowcaseProps = {
  rows: MarketingPricingRow[]
  currency?: string
  loading?: boolean
}

function PricingCardSkeleton({ index }: { index: number }) {
  return (
    <article
      className="marketing-pricing-card relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm"
      style={{ animationDelay: `${index * 80}ms` }}
      aria-hidden
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="h-6 w-32 animate-pulse rounded-lg bg-zinc-200" />
        </div>
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-7 w-20 animate-pulse rounded-lg bg-zinc-200" />
        </div>
        <div className="rounded-2xl bg-orange-50/70 p-4 ring-1 ring-orange-100/80">
          <div className="h-3 w-16 animate-pulse rounded bg-orange-100" />
          <div className="mt-3 h-7 w-20 animate-pulse rounded-lg bg-orange-100" />
        </div>
      </div>
    </article>
  )
}

export default function PricingShowcase({
  rows,
  currency = 'NGN',
  loading = false,
}: PricingShowcaseProps) {
  if (loading && rows.length === 0) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-busy="true"
        aria-label="Loading parking prices"
      >
        {VEHICLE_TYPES.map((vehicleType, index) => (
          <PricingCardSkeleton key={vehicleType} index={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row, index) => (
        <article
          key={row.vehicleType}
          className="marketing-pricing-card group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm transition duration-300 hover:border-orange-200 hover:shadow-md"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700/80">
                Vehicle class
              </p>
              <h3 className="font-display mt-1 text-xl font-bold text-zinc-900">
                {vehicleLabel[row.vehicleType]}
              </h3>
            </div>
            <VehicleTypeIconBadge
              type={row.vehicleType}
              title={vehicleLabel[row.vehicleType]}
            />
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Base rate
              </p>
              <p className="font-display mt-1 text-2xl font-bold text-zinc-900">
                {loading ? (
                  <span className="inline-block h-7 w-20 animate-pulse rounded-lg bg-zinc-200" />
                ) : (
                  formatMoney(row.defaultRate, currency)
                )}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50/70 p-4 ring-1 ring-orange-100/80">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-800/70">
                Extra hour
              </p>
              <p className="font-display mt-1 text-2xl font-bold text-orange-900">
                {loading ? (
                  <span className="inline-block h-7 w-20 animate-pulse rounded-lg bg-orange-100" />
                ) : (
                  formatMoney(row.extraHourRate, currency)
                )}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
