import type { ReactNode } from 'react'

type PayReceiptRootProps = {
  children: ReactNode
  className?: string
}

/** Paper-style receipt container — flat, minimal shadow. */
export function PayReceiptRoot({ children, className = '' }: PayReceiptRootProps) {
  return (
    <article
      className={`pay-receipt-paper w-full overflow-hidden border border-zinc-200 bg-white text-zinc-900 ${className}`.trim()}
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
    <header className="border-b border-dashed border-zinc-200 px-5 py-4 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-400">
        Seymour Aviation
      </p>
      <h2 className="mt-1.5 text-[15px] font-semibold leading-snug text-zinc-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{subtitle}</p>
      ) : null}
      {meta ? (
        <p className="mt-2 font-mono text-[11px] text-zinc-400">{meta}</p>
      ) : null}
    </header>
  )
}

export function PayReceiptBody({ children }: { children: ReactNode }) {
  return <div className="px-5 py-4">{children}</div>
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
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-2.5 text-sm last:border-b-0">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span
        className={`min-w-0 text-right text-zinc-900 ${mono ? 'font-mono text-[13px]' : ''} ${emphasize ? 'font-semibold' : 'font-medium'}`}
      >
        {value}
      </span>
    </div>
  )
}

export function PayReceiptDivider() {
  return (
    <hr
      className="my-3 border-0 border-t border-dashed border-zinc-200"
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
    <div className="mt-1 flex items-baseline justify-between gap-4 pt-3">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="text-xl font-semibold tabular-nums tracking-tight text-zinc-950">
        {amount}
      </span>
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
  neutral: 'bg-zinc-50 text-zinc-600',
  success: 'bg-zinc-50 text-zinc-700',
  warning: 'bg-zinc-50 text-zinc-700',
  error: 'bg-zinc-50 text-zinc-700',
}

export function PayReceiptStatus({
  children,
  tone = 'neutral',
}: PayReceiptStatusProps) {
  return (
    <p
      className={`border-b border-dashed border-zinc-200 px-5 py-2.5 text-center text-xs font-medium ${statusToneClass[tone]}`}
    >
      {children}
    </p>
  )
}

export function PayReceiptFootnote({ children }: { children: ReactNode }) {
  return (
    <footer className="border-t border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-3 text-center text-[11px] leading-relaxed text-zinc-500">
      {children}
    </footer>
  )
}

export function PayReceiptActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50/30 px-5 py-4">
      {children}
    </div>
  )
}
