/** Paginated `GET /admin/logs` response (shape may evolve). */
export interface AdminLogRecord {
  id: string
  at: string
  detail: string
  summary: string
  userLabel: string
  /** Backend action key — matches audit trail labels where possible */
  action: string
}

export interface AdminLogsPaginatedResponse {
  data: AdminLogRecord[]
  page: number
  page_size: number
  total: number
  total_pages: number
}
