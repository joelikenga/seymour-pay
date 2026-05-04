import LOGO from"../../public/seymour-retina-logo-288x118-1copy.svg";
interface SeymourLogoProps {
  className?: string
  /** Use PNG from /public when you add the official file */
  useRaster?: boolean
  /** Hide the text and show only the mark (e.g. compact mobile) */
  markOnly?: boolean
}

export default function SeymourLogo({
  className = '',
  useRaster = false,
  markOnly = false,
}: SeymourLogoProps) {
  if (useRaster) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <img
          src="/seymour-aviation-logo.png"
          alt="Seymour Aviation Ltd."
          className="h-9 w-auto max-w-[200px] object-left object-contain sm:h-10"
        />
      </span>
    )
  }



  if (markOnly) {
    return (
      <span className={`inline-flex items-center ${className}`} aria-hidden>
      {<img src={LOGO} className="w-15"/>}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-3  ${className}`}>
      {<img src={LOGO} className="w-15"/>}
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[14px] font-bold tracking-[0.14em] text-zinc-900 sm:text-[15px]">
          SEYMOUR
        </span>
        <span className="mt-1 text-[10px] font-bold tracking-[0.16em] text-zinc-600 sm:text-[11px]">
          AVIATION LTD
        </span>
      </span>
    </span>
  )
}
