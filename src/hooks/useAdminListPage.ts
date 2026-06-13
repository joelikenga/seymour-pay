import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

function parsePageParam(raw: string | null): number {
  const n = Number.parseInt(raw ?? '', 10)
  return Number.isFinite(n) && n >= 1 ? n - 1 : 0
}

/**
 * Keeps admin table page index in sync with `?page=` (1-based in the URL).
 * Pass `resetKeys` that should snap back to page 1 when they change (search, filters).
 */
export function useAdminListPage(resetKeys: readonly unknown[] = []) {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageIndex = parsePageParam(searchParams.get('page'))

  const setPageIndex = useCallback(
    (index: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const uiPage = index + 1
          if (uiPage <= 1) next.delete('page')
          else next.set('page', String(uiPage))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const resetSig = JSON.stringify(resetKeys)
  const prevResetSig = useRef(resetSig)
  useEffect(() => {
    if (prevResetSig.current === resetSig) return
    prevResetSig.current = resetSig
    setSearchParams(
      (prev) => {
        if (!prev.get('page')) return prev
        const next = new URLSearchParams(prev)
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }, [resetSig, setSearchParams])

  return {
    pageIndex,
    setPageIndex,
    uiPage: pageIndex + 1,
  }
}
