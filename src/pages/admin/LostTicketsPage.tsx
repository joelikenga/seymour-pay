import AdminTransactionsLedgerPage from './AdminTransactionsLedgerPage'

/**
 * Standalone admin page for lost-ticket ledger rows (`/admin/lost-tickets`).
 * Separate from Transactions — same table layout, different API scope.
 */
export default function LostTicketsPage() {
  return <AdminTransactionsLedgerPage variant="lostTickets" />
}
