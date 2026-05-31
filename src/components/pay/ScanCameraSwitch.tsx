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

type ScanCameraSwitchProps = {
  cameras: ReadonlyArray<PayScannerCameraDevice>
  value: string
  onChange: (deviceId: string) => void
  disabled?: boolean
}

export default function ScanCameraSwitch({
  cameras,
  value,
  onChange,
  disabled = false,
}: ScanCameraSwitchProps) {
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

  const closeMenu = useCallback(() => setOpen(false), [])

  const openMenu = useCallback(() => {
    if (disabled) return
    setActiveIndex(() => {
      const idx = options.findIndex((o) => o.value === value)
      return idx === -1 ? 0 : idx
    })
    setOpen(true)
  }, [disabled, options, value])

  const cycleCamera = useCallback(() => {
    if (disabled || options.length < 2) return
    const currentIndex = options.findIndex((o) => o.value === value)
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % options.length
    onChange(options[nextIndex].value)
  }, [disabled, onChange, options, value])

  const onSwitchClick = useCallback(() => {
    if (disabled) return
    if (options.length === 2) {
      cycleCamera()
      return
    }
    if (open) closeMenu()
    else openMenu()
  }, [closeMenu, cycleCamera, disabled, open, openMenu, options.length])

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
        if (options.length === 2) {
          cycleCamera()
        } else if (!open) {
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
    <div
      ref={wrapperRef}
      className="pointer-events-auto absolute inset-0 z-20"
    >
      <button
        type="button"
        id={triggerId}
        ref={triggerRef}
        aria-haspopup={options.length > 2 ? 'listbox' : undefined}
        aria-expanded={options.length > 2 ? open : undefined}
        aria-controls={open && options.length > 2 ? menuId : undefined}
        aria-label={
          options.length === 2 ? 'Switch camera' : 'Choose camera'
        }
        disabled={disabled}
        onClick={onSwitchClick}
        onKeyDown={onTriggerKeyDown}
        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-zinc-950/65 text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.65)] outline-none backdrop-blur-md transition hover:border-white/35 hover:bg-zinc-900/80 focus-visible:ring-2 focus-visible:ring-orange-400/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SwitchCameraIcon />
      </button>

      {open && options.length > 2 ? (
        <>
          <button
            type="button"
            aria-label="Close camera list"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={closeMenu}
          />
          <div
            ref={menuRef}
            id={menuId}
            role="listbox"
            aria-labelledby={triggerId}
            tabIndex={-1}
            className="absolute left-3 right-3 top-1/2 z-10 max-h-[min(220px,70%)] -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950/92 p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-xl"
          >
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Select camera
            </p>
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
        </>
      ) : null}
    </div>
  )
}

function SwitchCameraIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
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
