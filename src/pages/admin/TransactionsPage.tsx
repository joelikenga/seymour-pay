import AdminTransactionsLedgerPage from './AdminTransactionsLedgerPage'

/**
 * Regular completed transactions (`/admin/transactions`).
 * Lost-ticket rows are excluded here - see {@link LostTicketsPage}.
 */
export default function TransactionsPage() {
  return <AdminTransactionsLedgerPage variant="transactions" />
}
