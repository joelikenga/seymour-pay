import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { marketingEyebrow } from '../../lib/marketingUi'

type SectionHeaderProps = {
  eyebrow?: string
  title: ReactNode
  description?: string
  action?: { label: string; to: string }
  align?: 'left' | 'center'
  light?: boolean
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  light = false,
}: SectionHeaderProps) {
  const centered = align === 'center'

  return (
    <div
      className={`mb-12 sm:mb-16 ${
        centered ? 'mx-auto max-w-3xl text-center' : 'flex flex-wrap items-end justify-between gap-6'
      }`}
    >
      <div className={centered ? undefined : 'max-w-2xl'}>
        {eyebrow ? (
          <p className={`${marketingEyebrow} ${light ? 'border-white/20 bg-white/10 text-orange-200' : ''}`}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`font-display mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${
            light ? 'text-white' : 'text-zinc-900'
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-4 text-base leading-relaxed sm:text-lg ${
              light ? 'text-white/75' : 'text-zinc-600'
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action && !centered ? (
        <Link
          to={action.to}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-orange-700 transition hover:text-orange-900"
        >
          {action.label}
          <span className="transition group-hover:translate-x-1">&rarr;</span>
        </Link>
      ) : null}

      {action && centered ? (
        <Link
          to={action.to}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-300 transition hover:text-orange-200"
        >
          {action.label}
          <span>&rarr;</span>
        </Link>
      ) : null}
    </div>
  )
}
