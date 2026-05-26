import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { PayScannerCameraDevice } from '../../lib/payScanner'
import { formatPayScannerCameraLabel } from '../../lib/payScanner'

type ScanCameraDropdownProps = {
  cameras: ReadonlyArray<PayScannerCameraDevice>
  value: string
  onChange: (deviceId: string) => void
  disabled?: boolean
  className?: string
}

export default function ScanCameraDropdown({
  cameras,
  value,
  onChange,
  disabled = false,
  className,
}: ScanCameraDropdownProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const reactId = useId()
  const triggerId = `${reactId}-trigger`
  const menuId = `${reactId}-menu`

  const options = useMemo(
    () =>
      cameras.map((camera, index) => ({
        value: camera.id,
        label: formatPayScannerCameraLabel(camera.label, index),
      })),
    [cameras],
  )

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  )

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  const closeMenu = useCallback(() => setOpen(false), [])

  const openMenu = useCallback(() => {
    if (disabled) return
    setActiveIndex(() => {
      const idx = options.findIndex((o) => o.value === value)
      return idx === -1 ? 0 : idx
    })
    setOpen(true)
  }, [disabled, options, value])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (wrapperRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('touchstart', onPointer, { passive: true })
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('touchstart', onPointer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    menuRef.current
      ?.querySelector<HTMLElement>(`[data-dropdown-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const commit = useCallback(
    (next: string) => {
      onChange(next)
      setOpen(false)
      triggerRef.current?.focus()
    },
    [onChange],
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
        } else {
          commit(options[activeIndex].value)
        }
        break
      }
      default:
        break
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ''}`.trim()}>
      <button
        type="button"
        id={triggerId}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Select camera"
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-white/15 bg-zinc-950/70 px-4 py-2.5 text-left text-sm font-medium text-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)] outline-none ring-white/5 backdrop-blur-xl transition hover:border-white/25 hover:bg-zinc-900/80 focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <CameraIcon />
          <span className="truncate">
            {selected?.label ?? 'Select camera'}
          </span>
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
          className="absolute left-0 z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.75)] ring-1 ring-white/5 backdrop-blur-xl"
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
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                } ${isSelected ? 'font-semibold text-white' : ''}`.trim()}
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

function CameraIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-orange-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
      />
    </svg>
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
      className="shrink-0 text-orange-400"
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
