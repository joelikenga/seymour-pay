import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  SHIFT_FILTER_OPTIONS,
  labelForShiftFilter,
  type ShiftFilterValue,
} from '../../lib/cashierShift'

interface ShiftFilterDropdownProps {
  value: ShiftFilterValue
  onChange: (value: ShiftFilterValue) => void
}

export default function ShiftFilterDropdown({
  value,
  onChange,
}: ShiftFilterDropdownProps) {
  const titleId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const label = labelForShiftFilter(value)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter by shift"
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/40"
      >
        <span className="truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={titleId}
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,14rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-zinc-950/5"
        >
          <p
            id={titleId}
            className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
          >
            Shift
          </p>
          {SHIFT_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value)
                close()
              }}
              className={`flex w-full px-3 py-2 text-left text-sm font-medium transition ${
                value === opt.value
                  ? 'bg-orange-50 text-orange-900'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
