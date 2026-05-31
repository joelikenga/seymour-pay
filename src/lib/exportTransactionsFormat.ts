export type TransactionExportFormat = 'csv' | 'xls' | 'pdf'

export const TRANSACTION_EXPORT_FORMAT_OPTIONS: ReadonlyArray<{
  value: TransactionExportFormat
  label: string
}> = [
  { value: 'csv', label: 'CSV' },
  { value: 'xls', label: 'XLS' },
  { value: 'pdf', label: 'PDF' },
]

export function labelForExportFormat(format: TransactionExportFormat): string {
  return (
    TRANSACTION_EXPORT_FORMAT_OPTIONS.find((o) => o.value === format)?.label ??
    format.toUpperCase()
  )
}
