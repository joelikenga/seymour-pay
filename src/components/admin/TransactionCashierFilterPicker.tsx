import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  adminModalBackdrop,
  adminModalBody,
  adminModalCloseBtn,
  adminModalHeader,
  adminModalPanel,
  adminModalTitle,
} from '../../lib/adminModalStyles'

interface TransactionCashierFilterPickerProps {
  value: string
  onChange: (value: string) => void
  names: string[]
  loading?: boolean
  dateRangeLabel?: string
}

export default function TransactionCashierFilterPicker({
  value,
  onChange,
  names,
  loading = false,
  dateRangeLabel,
}: TransactionCashierFilterPickerProps) {
  const titleId = useId()
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const label =
    value.trim() === '' || value === 'all' ? 'All cashiers' : value.trim()

  const close = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return names
    return names.filter((name) => name.toLowerCase().includes(q))
  }, [names, search])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => searchRef.current?.focus())
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const pick = (next: string) => {
    onChange(next)
    close()
  }

  return (
    <>
      <button
        type="button"
        disabled={loading && names.length === 0}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Filter by cashier"
        className="inline-flex max-w-[min(100%,12rem)] items-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-2.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-primary/30 hover:bg-zinc-50/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{loading && !names.length ? 'Loading…' : label}</span>
        <UserIcon />
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
              role="presentation"
            >
              <button
                type="button"
                className={adminModalBackdrop}
                aria-label="Close cashier filter"
                onClick={close}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`${adminModalPanel} flex max-h-[min(85vh,32rem)] w-full max-w-md flex-col sm:max-h-[min(80vh,36rem)]`}
              >
                <div className={`${adminModalHeader} shrink-0`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 id={titleId} className={adminModalTitle}>
                        Filter by cashier
                      </h2>
                      {dateRangeLabel ? (
                        <p className="mt-1 text-xs text-zinc-500">
                          Cashiers for {dateRangeLabel}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={adminModalCloseBtn}
                      onClick={close}
                    >
                      Close
                    </button>
                  </div>
                  <label htmlFor={searchId} className="sr-only">
                    Search cashiers
                  </label>
                  <input
                    ref={searchRef}
                    id={searchId}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search cashiers…"
                    autoComplete="off"
                    className="mt-3 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>

                <div className={`${adminModalBody} min-h-0 flex-1 overflow-y-auto py-2`}>
                  <Option
                    selected={!value.trim() || value === 'all'}
                    onPick={() => pick('all')}
                  >
                    All cashiers
                  </Option>
                  {filteredNames.map((name) => (
                    <Option
                      key={name}
                      selected={value === name}
                      onPick={() => pick(name)}
                    >
                      {name}
                    </Option>
                  ))}
                  {!loading && filteredNames.length === 0 ? (
                    <p className="px-1 py-3 text-sm text-zinc-500">
                      {search.trim()
                        ? 'No cashiers match your search.'
                        : 'No cashiers found for this date range.'}
                    </p>
                  ) : null}
                  {loading ? (
                    <p className="px-1 py-2 text-xs text-zinc-500">
                      Updating cashier list…
                    </p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function Option({
  selected,
  onPick,
  children,
}: {
  selected: boolean
  onPick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm transition ${
        selected
          ? 'bg-primary-soft/22 font-semibold text-orange-950'
          : 'font-medium text-zinc-800 hover:bg-zinc-50'
      }`}
    >
      <span className="truncate">{children}</span>
      {selected ? (
        <span className="text-link" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 6.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : null}
    </button>
  )
}

function UserIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-zinc-400"
      aria-hidden
    >
      <path
        d="M20 21a8 8 0 10-16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
