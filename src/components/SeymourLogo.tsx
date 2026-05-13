/** Served from `public/` — filename contains a space */
const LOGO_SRC = '/logo%201.svg'

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

  const imgClass = markOnly
    ? 'h-8 w-auto max-w-[140px] object-contain object-left sm:h-9'
    : 'h-9 w-auto max-w-[min(100%,240px)] object-contain object-left sm:h-10'

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={LOGO_SRC}
        alt="Seymour Aviation Ltd."
        width={876}
        height={176}
        className={imgClass}
        decoding="async"
      />
    </span>
  )
}
