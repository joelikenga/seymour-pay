import { useCallback, useEffect, useId, useState } from 'react'
import type { CarParkAmenity } from '../../lib/marketingContent'
import { CAR_PARK_AMENITIES } from '../../lib/marketingContent'

const ROTATE_MS = 5500

function CarouselArrow({
  direction,
  onClick,
  label,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        {direction === 'prev' ? (
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}

function AmenitySlide({ amenity }: { amenity: CarParkAmenity }) {
  return (
    <article className="relative aspect-[16/9] min-h-[240px] w-full shrink-0 overflow-hidden rounded-3xl sm:min-h-[320px] lg:min-h-[420px]">
      <img
        src={amenity.imageUrl}
        alt={amenity.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-link/45" />
      <div className="absolute inset-x-0 bottom-0 bg-link/70 p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <h3 className="font-display max-w-3xl text-xl font-bold leading-snug text-white sm:text-2xl lg:text-3xl">
            {amenity.title}
          </h3>
          {amenity.highlight ? (
            <span className="font-display shrink-0 text-4xl font-bold leading-none text-orange-300 sm:text-5xl">
              {amenity.highlight}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

type AmenitiesShowcaseProps = {
  amenities?: CarParkAmenity[]
  className?: string
}

export default function AmenitiesShowcase({
  amenities = CAR_PARK_AMENITIES,
  className = '',
}: AmenitiesShowcaseProps) {
  const trackId = useId()
  const total = amenities.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return
      setIndex(((next % total) + total) % total)
    },
    [total],
  )

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])
  const goNext = useCallback(() => goTo(index + 1), [goTo, index])

  useEffect(() => {
    if (paused || total <= 1) return
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [paused, total])

  if (total === 0) return null

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="relative overflow-hidden rounded-3xl"
        role="region"
        aria-roledescription="carousel"
        aria-label="Car park amenities"
      >
        <div
          id={trackId}
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {amenities.map((amenity) => (
            <div
              key={amenity.id}
              className="w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={amenity.title}
            >
              <AmenitySlide amenity={amenity} />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
          <div className="pointer-events-auto">
            <CarouselArrow direction="prev" onClick={goPrev} label="Previous amenity" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
          <div className="pointer-events-auto">
            <CarouselArrow direction="next" onClick={goNext} label="Next amenity" />
          </div>
        </div>
      </div>

      <div
        className="mt-5 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Amenity slides"
      >
        {amenities.map((amenity, i) => (
          <button
            key={amenity.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-controls={trackId}
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-8 bg-orange-600' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'
            }`}
          >
            <span className="sr-only">{amenity.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
