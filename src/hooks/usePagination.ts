import { useEffect, useMemo, useState } from 'react'

export function usePagination<T>(
  items: readonly T[],
  pageSize: number,
  resetKey?: unknown,
) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (resetKey !== undefined) setPage(1)
  }, [resetKey])
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  return {
    page: safePage,
    setPage,
    totalPages,
    paginated,
    total,
    from,
    to,
  }
}
