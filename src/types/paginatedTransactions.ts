import type { Transaction } from './transaction'

/** Paginated list for settlement / ledger endpoints */
export interface PaginatedTransactionsResponse {
  data: Transaction[]
  page: number
  page_size: number
  total: number
  total_pages: number
}
