type AdminTableSkeletonBodyProps = {
  /** Body rows to show */
  rows?: number
  /** Number of data columns (excluding optional checkbox column). */
  columns: number
  /** Leading narrow checkbox column (reconciliation). */
  checkboxColumn?: boolean
  /** 0-based data column indices that match right-aligned cells (e.g. amount). */
  rightAlignIndices?: number[]
  /** Matches real `<td>` padding for the host table. */
  tdClassName?: string
}

const BAR = 'block h-4 animate-pulse rounded-md bg-zinc-200/80'

const WIDTH_CYCLE = [
  'max-w-[7rem]',
  'max-w-[4.5rem]',
  'max-w-[5rem]',
  'max-w-[5rem]',
  'max-w-[4.5rem]',
  'max-w-[6rem]',
  'max-w-[3.5rem]',
] as const

/**
 * Placeholder `<tbody>` rows - keep the real `<thead>` from the page for layout match.
 */
export default function AdminTableSkeletonBody({
  rows = 8,
  columns,
  checkboxColumn = false,
  rightAlignIndices = [],
  tdClassName = 'whitespace-nowrap px-5 py-3.5',
}: AdminTableSkeletonBodyProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, ri) => (
        <tr key={ri} aria-hidden>
          {checkboxColumn ? (
            <td className="w-10 whitespace-nowrap px-4 py-3.5 align-middle">
              <div className="mx-auto h-5 w-5 animate-pulse rounded-md bg-zinc-200/70" />
            </td>
          ) : null}
          {Array.from({ length: columns }, (_, ci) => {
            const right = rightAlignIndices.includes(ci)
            const w = WIDTH_CYCLE[ci % WIDTH_CYCLE.length]
            return (
              <td
                key={ci}
                className={`${tdClassName} ${right ? 'text-right' : ''}`}
              >
                <span className={`${BAR} ${w} ${right ? 'ml-auto' : ''}`} />
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
