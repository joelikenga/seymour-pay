import type { ReactNode } from 'react'

export interface TableToolbarProps {
  /** Left-side content (typically the search input). */
  children: ReactNode
  /** Right-side content (counters, filter chips, action buttons). */
  right?: ReactNode
  /** Optional supplementary row rendered below the main toolbar (warnings, etc.). */
  footer?: ReactNode
  /** Override the outer wrapper classes if a page needs a tweak. */
  className?: string
}

/**
 * Canonical admin-table toolbar - light gradient background, bottom border, and
 * a flex row that stacks on mobile. Pages drop their search box (left) and any
 * counters / chips / action buttons (right) into the corresponding slots so all
 * tables share the same chrome.
 */
export default function TableToolbar({
  children,
  right,
  footer,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={`border-b border-zinc-100 bg-linear-to-r from-white to-zinc-50/90 ${
        className ?? ''
      }`.trim()}
    >
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 flex-1 sm:max-w-md">
          {children}
        </div>
        {right ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 sm:justify-end">
            {right}
          </div>
        ) : null}
      </div>
      {footer ? <div className="px-5 pb-4 sm:px-5">{footer}</div> : null}
    </div>
  )
}
