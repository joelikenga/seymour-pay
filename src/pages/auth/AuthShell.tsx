import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SeymourLogo from '../../components/SeymourLogo'

interface AuthShellProps {
  title: string
  subtitle: string
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  /** Optional footer line with a single link (e.g. back to login). */
  footerText?: string
  footerLinkText?: string
  footerLinkTo?: string
}

export default function AuthShell({
  title,
  subtitle,
  onSubmit,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <SeymourLogo className="mb-6" />
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {children}
        </form>

        {footerText && footerLinkText && footerLinkTo ? (
          <p className="mt-5 text-sm text-zinc-600">
            {footerText}{' '}
            <Link to={footerLinkTo} className="font-medium text-zinc-900 underline underline-offset-2">
              {footerLinkText}
            </Link>
          </p>
        ) : null}
      </section>
    </main>
  )
}
