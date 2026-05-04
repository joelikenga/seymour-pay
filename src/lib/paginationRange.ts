/** Windowed page numbers with ellipses for long ranges. */
export function buildPaginationRange(
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 1) return [1]
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: (number | 'ellipsis')[] = []
  const leftEllipsis = currentPage > 4
  const rightEllipsis = currentPage < totalPages - 3

  items.push(1)

  if (leftEllipsis) items.push('ellipsis')

  const start = Math.max(2, currentPage - 2)
  const end = Math.min(totalPages - 1, currentPage + 2)

  for (let p = start; p <= end; p++) {
    items.push(p)
  }

  if (rightEllipsis) items.push('ellipsis')

  items.push(totalPages)

  return items
}
