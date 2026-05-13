import SeymourLogo from './SeymourLogo'

type SeymourLoadingShellProps = {
  /** Minimum height of the shell (Tailwind class). */
  minHeightClass?: string
  className?: string
}

/**
 * Branded loading state: full-area white background, Seymour logo, three staggered
 * “snake” hover balls (outer neutral, center brand blue).
 */
export default function SeymourLoadingShell({
  minHeightClass = 'min-h-[50vh]',
  className = '',
}: SeymourLoadingShellProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center bg-white px-6 py-16 ${minHeightClass} ${className}`}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-9">
        <SeymourLogo className="max-w-[min(100%,280px)] opacity-[0.98]" />
        <div
          className="flex h-10 items-center justify-center gap-4"
          aria-hidden
        >
          <span className="seymour-loader-ball seymour-loader-ball--a bg-zinc-400" />
          <span className="seymour-loader-ball seymour-loader-ball--b bg-link" />
          <span className="seymour-loader-ball seymour-loader-ball--c bg-zinc-400" />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}
