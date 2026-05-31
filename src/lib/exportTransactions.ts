import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDateShort, formatMoney } from './formatters'
import type { TransactionExportFormat } from './exportTransactionsFormat'
import { transactionsToCsv } from './transactionDateFilter'

export type { TransactionExportFormat } from './exportTransactionsFormat'
export {
  labelForExportFormat,
  TRANSACTION_EXPORT_FORMAT_OPTIONS,
} from './exportTransactionsFormat'

export type TransactionExportRow = {
  reference: string
  customerName: string
  vehicleType: string
  channel: string
  amount: number
  status: string
  createdAt: string
  notes: string
}

const HEADERS = [
  'Ticket ID',
  'Customer',
  'Vehicle',
  'Payment type',
  'Amount',
  'Status',
  'Date',
  'Notes',
] as const

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function rowsToSheetData(rows: TransactionExportRow[]): string[][] {
  return [
    [...HEADERS],
    ...rows.map((t) => [
      t.reference,
      t.customerName,
      t.vehicleType,
      t.channel,
      String(t.amount),
      t.status,
      t.createdAt,
      t.notes ?? '',
    ]),
  ]
}

function downloadXls(filename: string, rows: TransactionExportRow[]) {
  const sheet = XLSX.utils.aoa_to_sheet(rowsToSheetData(rows))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Transactions')
  XLSX.writeFile(book, filename, { bookType: 'xls' })
}

function downloadPdf(filename: string, rows: TransactionExportRow[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  autoTable(doc, {
    head: [[...HEADERS]],
    body: rows.map((t) => [
      t.reference,
      t.customerName,
      t.vehicleType,
      t.channel,
      formatMoney(t.amount),
      t.status,
      formatDateShort(t.createdAt),
      t.notes?.trim() ? t.notes : '—',
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [24, 24, 27] },
    margin: { top: 36, right: 24, bottom: 24, left: 24 },
    didDrawPage: (data) => {
      doc.setFontSize(11)
      doc.setTextColor(24, 24, 27)
      doc.text('Transactions export', data.settings.margin.left, 24)
    },
  })
  doc.save(filename)
}

export function downloadTransactionExport(
  rows: TransactionExportRow[],
  format: TransactionExportFormat,
  filenameBase: string,
) {
  switch (format) {
    case 'csv':
      downloadBlob(
        `${filenameBase}.csv`,
        new Blob([transactionsToCsv(rows)], { type: 'text/csv;charset=utf-8' }),
      )
      break
    case 'xls':
      downloadXls(`${filenameBase}.xls`, rows)
      break
    case 'pdf':
      downloadPdf(`${filenameBase}.pdf`, rows)
      break
  }
}
