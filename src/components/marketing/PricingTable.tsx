import { VehicleTypeIconBadge } from '../admin/VehicleTypeGlyph'
import { formatMoney } from '../../lib/formatters'
import { vehicleLabel } from '../../lib/vehicleStyles'
import type { MarketingPricingRow } from '../../types/marketingPricing'

type PricingTableProps = {
  rows: MarketingPricingRow[]
  currency?: string
  loading?: boolean
  compact?: boolean
}

export default function PricingTable({
  rows,
  currency = 'NGN',
  loading = false,
  compact = false,
}: PricingTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80">
              <th className="px-4 py-3 font-semibold text-zinc-700 sm:px-6">Vehicle type</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 sm:px-6">Base rate</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 sm:px-6">Extra hour</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.vehicleType}
                className="border-b border-zinc-100 last:border-b-0"
              >
                <td className="px-4 py-3 sm:px-6">
                  <span className="inline-flex items-center gap-2.5">
                    {!compact ? (
                      <VehicleTypeIconBadge
                        type={row.vehicleType}
                        title={vehicleLabel[row.vehicleType]}
                      />
                    ) : null}
                    <span className="font-medium text-zinc-900">
                      {vehicleLabel[row.vehicleType]}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-900 sm:px-6">
                  {loading ? (
                    <span className="inline-block h-4 w-16 animate-pulse rounded bg-zinc-200" />
                  ) : (
                    formatMoney(row.defaultRate, currency)
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-700 sm:px-6">
                  {loading ? (
                    <span className="inline-block h-4 w-16 animate-pulse rounded bg-zinc-200" />
                  ) : (
                    formatMoney(row.extraHourRate, currency)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
