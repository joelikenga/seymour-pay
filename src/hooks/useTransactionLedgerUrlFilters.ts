import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from './useDebouncedValue'
import {
  applyLedgerFiltersToSearchParams,
  readLedgerFiltersFromSearchParams,
  type TransactionLedgerUrlFilters,
} from '../lib/transactionLedgerSearchParams'

type UseTransactionLedgerUrlFiltersOptions = {
  showCashierFilter: boolean
  showCustomDateFilter: boolean
  /** When false, superadmin-only params are not stripped yet (profile loading). */
  accessResolved?: boolean
}

export function useTransactionLedgerUrlFilters({
  showCashierFilter,
  showCustomDateFilter,
  accessResolved = true,
}: UseTransactionLedgerUrlFiltersOptions) {
  const [searchParams, setSearchParams] = useSearchParams()

  const urlOptions = useMemo(
    () => ({
      allowCashier: showCashierFilter,
      allowCustomDates: showCustomDateFilter,
    }),
    [showCashierFilter, showCustomDateFilter],
  )

  const urlFilters = useMemo(
    () => readLedgerFiltersFromSearchParams(searchParams, urlOptions),
    [searchParams, urlOptions],
  )

  const [q, setQ] = useState(urlFilters.search)
  const debouncedQ = useDebouncedValue(q, 300)

  useEffect(() => {
    setQ(urlFilters.search)
  }, [urlFilters.search])

  const patchUrlFilters = useCallback(
    (patch: Partial<TransactionLedgerUrlFilters>) => {
      setSearchParams(
        (prev) => {
          const current = readLedgerFiltersFromSearchParams(prev, urlOptions)
          return applyLedgerFiltersToSearchParams(
            prev,
            { ...current, ...patch },
            urlOptions,
          )
        },
        { replace: true },
      )
    },
    [setSearchParams, urlOptions],
  )

  useEffect(() => {
    const nextSearch = debouncedQ.trim()
    if (nextSearch === urlFilters.search) return
    patchUrlFilters({ search: nextSearch })
  }, [debouncedQ, patchUrlFilters, urlFilters.search])

  useEffect(() => {
    if (!accessResolved) return
    const patch: Partial<TransactionLedgerUrlFilters> = {}
    if (
      !showCustomDateFilter &&
      (urlFilters.customStart.trim() || urlFilters.customEnd.trim())
    ) {
      patch.customStart = ''
      patch.customEnd = ''
    }
    if (!showCashierFilter && urlFilters.cashier.trim() !== 'all') {
      patch.cashier = 'all'
    }
    if (Object.keys(patch).length === 0) return
    patchUrlFilters(patch)
  }, [
    accessResolved,
    patchUrlFilters,
    showCashierFilter,
    showCustomDateFilter,
    urlFilters.cashier,
    urlFilters.customEnd,
    urlFilters.customStart,
  ])

  const setFilterValue = useCallback(
    (value: string) => patchUrlFilters({ filterValue: value }),
    [patchUrlFilters],
  )

  const setCustomStart = useCallback(
    (value: string) => patchUrlFilters({ customStart: value }),
    [patchUrlFilters],
  )

  const setCustomEnd = useCallback(
    (value: string) => patchUrlFilters({ customEnd: value }),
    [patchUrlFilters],
  )

  const setCashierFilter = useCallback(
    (value: string) => patchUrlFilters({ cashier: value }),
    [patchUrlFilters],
  )

  return {
    filterValue: urlFilters.filterValue,
    setFilterValue,
    customStart: urlFilters.customStart,
    setCustomStart,
    customEnd: urlFilters.customEnd,
    setCustomEnd,
    cashierFilter: urlFilters.cashier,
    setCashierFilter,
    q,
    setQ,
    debouncedQ,
  }
}
