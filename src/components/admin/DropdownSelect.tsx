import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

export interface DropdownOption<V extends string> {
  value: V
  label: string
}

export interface DropdownSelectProps<V extends string> {
  /** Currently selected option value. */
  value: V
  /** Available options, in display order. */
  options: ReadonlyArray<DropdownOption<V>>
  /** Called when the user picks a new option. */
  onChange: (value: V) => void
  /** Visible label text rendered above the trigger (set to false to hide). */
  label?: string | false
  /** Accessible label override when `label` is hidden. */
  ariaLabel?: string
  /** Placeholder shown when nothing is selected. */
  placeholder?: string
  /** Disable the dropdown. */
  disabled?: boolean
  /** Tighten the trigger padding (handy in dense layouts). */
  size?: 'md' | 'sm'
  /** Optional class for the outer wrapper. */
  className?: string
  /** Optional class for the trigger button. */
  triggerClassName?: string
  /** Match the menu width to the trigger (default true). */
  matchTriggerWidth?: boolean
}

const TRIGGER_BASE =
  'flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 text-left text-sm font-medium text-zinc-800 shadow-sm outline-none ring-zinc-950/5 transition hover:bg-white focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50'

const SIZE_PADDING: Record<'md' | 'sm', string> = {
  md: 'px-4 py-2.5',
  sm: 'px-3 py-2',
}

/**
 * Custom div-based dropdown - replaces native `<select>` so we can fully style
 * the trigger / menu / option rows. Keyboard support: Enter/Space/Arrow toggles
 * and moves through options; Escape closes.
 */
export default function DropdownSelect<V extends string>({
  value,
  options,
  onChange,
  label,
  ariaLabel,
  placeholder = 'Select…',
  disabled = false,
  size = 'md',
  className,
  triggerClassName,
  matchTriggerWidth = true,
}: DropdownSelectProps<V>) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  )
  const reactId = useId()
  const triggerId = `${reactId}-trigger`
  const menuId = `${reactId}-menu`

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  const focusTrigger = useCallback(() => {
    triggerRef.current?.focus()
  }, [])

  const closeMenu = useCallback(() => {
    setOpen(false)
  }, [])

  const openMenu = useCallback(() => {
    if (disabled) return
    setActiveIndex(() => {
      const idx = options.findIndex((o) => o.value === value)
      return idx === -1 ? 0 : idx
    })
    setOpen(true)
  }, [disabled, options, value])

  // Click-outside handler.
  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (wrapperRef.current && wrapperRef.current.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('touchstart', onPointer, { passive: true })
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('touchstart', onPointer)
    }
  }, [open])

  // Close on Escape from anywhere within the dropdown.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        focusTrigger()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, focusTrigger])

  // When the menu opens, scroll the active option into view.
  useEffect(() => {
    if (!open) return
    const el = menuRef.current?.querySelector<HTMLElement>(
      `[data-dropdown-index="${activeIndex}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const commit = useCallback(
    (next: V) => {
      onChange(next)
      setOpen(false)
      focusTrigger()
    },
    [onChange, focusTrigger],
  )

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ': {
        event.preventDefault()
        if (!open) {
          openMenu()
        } else if (event.key === 'ArrowDown') {
          setActiveIndex((i) => (i + 1) % options.length)
        } else if (event.key === 'ArrowUp') {
          setActiveIndex((i) => (i - 1 + options.length) % options.length)
        } else if (event.key === 'Enter' || event.key === ' ') {
          commit(options[activeIndex].value)
        }
        break
      }
      case 'Home': {
        if (open) {
          event.preventDefault()
          setActiveIndex(0)
        }
        break
      }
      case 'End': {
        if (open) {
          event.preventDefault()
          setActiveIndex(options.length - 1)
        }
        break
      }
      default:
        break
    }
  }

  const showLabel = label !== false && typeof label === 'string'

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className ?? ''}`.trim()}
    >
      {showLabel ? (
        <label
          htmlFor={triggerId}
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          {label}
        </label>
      ) : null}
      <button
        type="button"
        id={triggerId}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={!showLabel ? ariaLabel : undefined}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`${TRIGGER_BASE} ${SIZE_PADDING[size]} ${
          showLabel ? 'mt-1.5' : ''
        } ${triggerClassName ?? ''}`.trim()}
      >
        <span
          className={`min-w-0 truncate ${
            selected ? 'text-zinc-900' : 'text-zinc-400'
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-labelledby={triggerId}
          tabIndex={-1}
          className={`absolute left-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-2xl ring-1 ring-zinc-950/5 ${
            matchTriggerWidth ? 'w-full' : 'min-w-48'
          }`}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value
            const isActive = index === activeIndex
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                data-dropdown-index={index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(opt.value)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-50'
                } ${isSelected ? 'font-semibold text-zinc-950' : ''}`.trim()}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected ? <Checkmark /> : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 text-zinc-400 transition-transform ${
        open ? 'rotate-180' : ''
      }`}
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

function Checkmark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-orange-600"
    >
      <path
        d="M5 12l5 5L20 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
