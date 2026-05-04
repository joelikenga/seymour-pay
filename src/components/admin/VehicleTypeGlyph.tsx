import type { VehicleType } from '../../types/transaction'

import carAsset from '../../assets/car.svg'
import smallSuvAsset from '../../assets/small-suv.svg'
import bigSuvAsset from '../../assets/big-suv.svg'
import busAsset from '../../assets/bus.svg'
import coasterAsset from '../../assets/coaster.svg'

const GLYPH_CLASS: Record<VehicleType, string> = {
  car: 'h-6 w-[52px]',
  small_suv: 'h-7 w-[56px]',
  big_suv: 'h-8 w-[60px]',
  bus: 'h-7 w-[74px]',
  coaster: 'h-9 w-[90px]',
}

const VEHICLE_SRC: Record<VehicleType, string> = {
  car: carAsset,
  small_suv: smallSuvAsset,
  big_suv: bigSuvAsset,
  bus: busAsset,
  coaster: coasterAsset,
}

/** Vehicle silhouettes from `src/assets` (SVG URLs via Vite). */
export function VehicleTypeGlyph({
  type,
  className = '',
}: {
  type: VehicleType
  className?: string
}) {
  const dim = GLYPH_CLASS[type]
  const imgCls = `block shrink-0 object-contain ${dim} ${className}`.trim()

  return (
    <img
      src={VEHICLE_SRC[type]}
      alt=""
      className={imgCls}
      draggable={false}
      aria-hidden
    />
  )
}

const BADGE_BOX: Record<VehicleType, string> = {
  car: 'min-h-[44px] min-w-[60px] px-2 py-2',
  small_suv: 'min-h-[48px] min-w-[64px] px-2 py-2',
  big_suv: 'min-h-[52px] min-w-[68px] px-2 py-2',
  bus: 'min-h-[48px] min-w-[82px] px-2 py-2',
  coaster: 'min-h-[56px] min-w-[98px] px-2 py-2',
}

export function VehicleTypeIconBadge({
  type,
  title,
}: {
  type: VehicleType
  title: string
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl bg-zinc-100 ring-1 ring-zinc-200/90 ${BADGE_BOX[type]}`}
      role="img"
      aria-label={title}
    >
      <VehicleTypeGlyph type={type} />
    </span>
  )
}
