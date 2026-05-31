import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { TransactionExportFormat } from '../../lib/exportTransactionsFormat'
import { TRANSACTION_EXPORT_FORMAT_OPTIONS } from '../../lib/exportTransactionsFormat'

interface ExportDropdownProps {
  onExport: (format: TransactionExportFormat) => void
  disabled?: boolean
  exporting?: boolean
}

const FORMAT_META: Record<
  TransactionExportFormat,
  { title: string; hint: string }
> = {
  csv: { title: 'CSV', hint: 'Comma-separated values' },
  xls: { title: 'Excel', hint: 'Spreadsheet (.xls)' },
  pdf: { title: 'PDF', hint: 'Print-ready document' },
}

export default function ExportDropdown({
  onExport,
  disabled = false,
  exporting = false,
}: ExportDropdownProps) {
  const titleId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const close = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveIndex(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const pick = useCallback(
    (format: TransactionExportFormat) => {
      close()
      onExport(format)
    },
    [close, onExport],
  )

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || exporting) return
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (!open) {
          setOpen(true)
        } else if (e.key === 'ArrowDown') {
          setActiveIndex(
            (i) => (i + 1) % TRANSACTION_EXPORT_FORMAT_OPTIONS.length,
          )
        } else if (e.key === 'ArrowUp') {
          setActiveIndex(
            (i) =>
              (i - 1 + TRANSACTION_EXPORT_FORMAT_OPTIONS.length) %
              TRANSACTION_EXPORT_FORMAT_OPTIONS.length,
          )
        } else {
          pick(TRANSACTION_EXPORT_FORMAT_OPTIONS[activeIndex].value)
        }
        break
      }
      default:
        break
    }
  }

  const triggerDisabled = disabled || exporting

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={triggerDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label="Export transactions"
        onClick={() => {
          if (triggerDisabled) return
          setOpen((o) => !o)
        }}
        onKeyDown={onTriggerKeyDown}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-40 ${
          open ? 'ring-2 ring-primary/30' : ''
        }`}
      >
        <DownloadIcon />
        {exporting ? 'Exporting…' : 'Export'}
        {!exporting ? <ChevronIcon open={open} /> : null}
      </button>

      {open && !triggerDisabled ? (
        <>
          <div
            className="fixed inset-0 z-40 sm:hidden"
            aria-hidden
            onClick={close}
          />
          <div
            id={titleId}
            role="listbox"
            aria-label="Choose export format"
            className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-zinc-950/5 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-56 sm:max-w-none"
          >
            <div className="border-b border-zinc-100 bg-linear-to-r from-white to-zinc-50/80 px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Export as
              </p>
            </div>
            <div className="p-1.5">
              {TRANSACTION_EXPORT_FORMAT_OPTIONS.map((opt, index) => {
                const meta = FORMAT_META[opt.value]
                const isActive = index === activeIndex
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isActive}
                    tabIndex={-1}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => pick(opt.value)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition ${
                      isActive ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200/80 ring-inset">
                      <FormatIcon format={opt.value} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-zinc-900">
                        {meta.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                        {meta.hint}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 opacity-90"
      aria-hidden
    >
      <path
        d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FormatIcon({
  format,
  className = '',
}: {
  format: TransactionExportFormat
  className?: string
}) {
  const cls = `h-4 w-4 shrink-0 ${className}`.trim()
  if (format === 'csv') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M14 3v5h5M8 13h8M8 17h5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (format === 'xls') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M14 3v5h5M8 12l2.5 3L13 12l-2.5-3L8 12z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M8 13h3M8 17h6M8 9h2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 opacity-80 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
