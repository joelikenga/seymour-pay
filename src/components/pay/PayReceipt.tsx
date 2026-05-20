import type { ReactNode } from 'react'

type PayReceiptRootProps = {
  children: ReactNode
  className?: string
}

/** Paper-style receipt container - flat, minimal shadow. */
export function PayReceiptRoot({ children, className = '' }: PayReceiptRootProps) {
  return (
    <article
      className={`pay-receipt-paper mx-auto w-full max-w-lg overflow-hidden border border-zinc-200/90 bg-white text-zinc-900 sm:rounded-2xl lg:max-w-xl ${className}`.trim()}
    >
      {children}
    </article>
  )
}

type PayReceiptBrandHeaderProps = {
  title: string
  subtitle?: string
  meta?: string
}

export function PayReceiptBrandHeader({
  title,
  subtitle,
  meta,
}: PayReceiptBrandHeaderProps) {
  return (
    <header className="relative border-b border-dashed border-zinc-200 px-5 py-5 text-center sm:px-6 sm:py-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-orange-500 via-amber-400 to-orange-600"
        aria-hidden
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
        Seymour Aviation
      </p>
      <h2 className="mt-2 text-lg font-bold leading-snug tracking-tight text-zinc-900 sm:text-xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{subtitle}</p>
      ) : null}
      {meta ? (
        <p className="mt-2.5 inline-block rounded-full bg-zinc-100 px-3 py-1 font-mono text-[11px] font-medium text-zinc-600">
          {meta}
        </p>
      ) : null}
    </header>
  )
}

export function PayReceiptBody({ children }: { children: ReactNode }) {
  return <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
}

export function PayReceiptSection({ children }: { children: ReactNode }) {
  return <section className="space-y-0">{children}</section>
}

type PayReceiptRowProps = {
  label: string
  value: string
  mono?: boolean
  emphasize?: boolean
}

export function PayReceiptRow({
  label,
  value,
  mono,
  emphasize,
}: PayReceiptRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-3 text-sm last:border-b-0 sm:py-3.5">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span
        className={`min-w-0 text-right text-zinc-900 ${mono ? 'font-mono text-[13px]' : ''} ${emphasize ? 'font-semibold text-zinc-950' : 'font-medium'}`}
      >
        {value}
      </span>
    </div>
  )
}

export function PayReceiptDivider() {
  return (
    <hr
      className="my-4 border-0 border-t border-dashed border-zinc-200"
      aria-hidden
    />
  )
}

type PayReceiptTotalProps = {
  label: string
  amount: string
}

export function PayReceiptTotal({ label, amount }: PayReceiptTotalProps) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-linear-to-br from-orange-50/80 to-amber-50/40 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-orange-800/70">
          {label}
        </span>
        <span className="text-2xl font-bold tabular-nums tracking-tight text-zinc-950 sm:text-[1.75rem]">
          {amount}
        </span>
      </div>
    </div>
  )
}

type PayReceiptStatusProps = {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}

const statusToneClass: Record<
  NonNullable<PayReceiptStatusProps['tone']>,
  string
> = {
  neutral: 'bg-zinc-50 text-zinc-700',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-900',
  error: 'bg-rose-50 text-rose-800',
}

const statusDotClass: Record<
  NonNullable<PayReceiptStatusProps['tone']>,
  string
> = {
  neutral: 'bg-zinc-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
}

export function PayReceiptStatus({
  children,
  tone = 'neutral',
}: PayReceiptStatusProps) {
  return (
    <p
      className={`flex items-center justify-center gap-2 border-b border-dashed border-zinc-200 px-5 py-3 text-xs font-semibold sm:text-[13px] ${statusToneClass[tone]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass[tone]}`}
        aria-hidden
      />
      {children}
    </p>
  )
}

export function PayReceiptFootnote({ children }: { children: ReactNode }) {
  return (
    <footer className="border-t border-dashed border-zinc-200 bg-zinc-50/60 px-5 py-3.5 text-center text-[11px] leading-relaxed text-zinc-500 sm:px-6">
      {children}
    </footer>
  )
}

export function PayReceiptActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-zinc-200 bg-zinc-50/40 px-5 py-5 sm:px-6">
      {children}
    </div>
  )
}
