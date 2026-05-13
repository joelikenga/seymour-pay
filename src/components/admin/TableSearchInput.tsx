import type { ChangeEvent, RefObject } from 'react'

export interface TableSearchInputProps {
  /** Controlled value of the search box. */
  value: string
  /** Called with the new string when the user types. */
  onChange: (value: string) => void
  /** Visible placeholder text. */
  placeholder?: string
  /** Accessible label exposed to screen readers (visually hidden). */
  ariaLabel?: string
  /** Override the default `sm:max-w-md` width by passing custom Tailwind classes. */
  className?: string
  /** Focus programmatically (e.g. after navigation). */
  inputRef?: RefObject<HTMLInputElement | null>
  readOnly?: boolean
  onFocus?: () => void
}

/**
 * Canonical admin-table search input — matches the Reconciliation page chrome
 * (rounded-2xl shell, inset shadow, orange focus ring, leading magnifier icon).
 * All admin tables should use this so search inputs look identical everywhere.
 */
export default function TableSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  ariaLabel = 'Search',
  className,
  inputRef,
  readOnly,
  onFocus,
}: TableSearchInputProps) {
  return (
    <label
      className={`relative w-full ${className ?? 'sm:max-w-md'}`.trim()}
    >
      <span className="sr-only">{ariaLabel}</span>
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16 16l5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        ref={inputRef}
        type="search"
        readOnly={readOnly}
        value={value}
        onFocus={() => onFocus?.()}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-inner outline-none placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary/15 read-only:cursor-pointer read-only:bg-zinc-50/80"
      />
    </label>
  )
}
