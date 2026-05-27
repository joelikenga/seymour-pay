function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

export interface UnwrappedPaginatedBody {
  data?: unknown[]
  page?: number
  page_size?: number
  total?: number
  total_pages?: number
}

/**
 * Normalizes list endpoints that may return rows at the top level or under
 * `{ data: { data, total, … } }` / `{ items }` / `{ transactions }`.
 */
export function unwrapPaginatedListBody(raw: unknown): UnwrappedPaginatedBody {
  const root = asRecord(raw)
  if (!root) return {}

  if (Array.isArray(root.data)) {
    return {
      data: root.data,
      page: root.page as number | undefined,
      page_size: root.page_size as number | undefined,
      total: root.total as number | undefined,
      total_pages: root.total_pages as number | undefined,
    }
  }

  const nested = asRecord(root.data)
  if (nested && Array.isArray(nested.data)) {
    return {
      data: nested.data,
      page: (nested.page ?? root.page) as number | undefined,
      page_size: (nested.page_size ?? root.page_size) as number | undefined,
      total: (nested.total ?? root.total) as number | undefined,
      total_pages: (nested.total_pages ?? root.total_pages) as number | undefined,
    }
  }

  const items = root.items ?? root.transactions ?? root.results
  if (Array.isArray(items)) {
    return {
      data: items,
      page: root.page as number | undefined,
      page_size: root.page_size as number | undefined,
      total: root.total as number | undefined,
      total_pages: root.total_pages as number | undefined,
    }
  }

  return {
    page: root.page as number | undefined,
    page_size: root.page_size as number | undefined,
    total: root.total as number | undefined,
    total_pages: root.total_pages as number | undefined,
  }
}
