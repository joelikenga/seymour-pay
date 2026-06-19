import type { ReactNode } from 'react'
import { marketingContainer } from '../../lib/marketingUi'

type PageHeroProps = {
  eyebrow: string
  title: ReactNode
  description: string
  children?: ReactNode
  imageUrl?: string
  compact?: boolean
}

export default function PageHero({
  eyebrow,
  title,
  description,
  children,
  imageUrl = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80',
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={`relative overflow-hidden bg-link text-white ${
        compact ? 'py-20 sm:py-24' : 'min-h-[88vh] py-24 sm:min-h-[92vh] sm:py-32'
      }`}
    >
      <img
        src={imageUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="marketing-hero-overlay absolute inset-0" />

      <div className={`relative ${marketingContainer}`}>
        <div className="max-w-3xl marketing-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 marketing-pulse-dot" />
            {eyebrow}
          </p>
          <h1 className="font-display mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {description}
          </p>
          {children ? <div className="mt-10 flex flex-wrap gap-4">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}
