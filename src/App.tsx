import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppToaster } from './components/AppToaster'
import SeymourLoadingShell from './components/SeymourLoadingShell'
import { NetworkStatusToasts } from './components/NetworkStatusToasts'
import NavigationLogger from './components/admin/NavigationLogger'
import PwaInstallPrompt from './components/PwaInstallPrompt'
import SessionLoginLogger from './components/admin/SessionLoginLogger'
import { AdminDataProvider } from './context/AdminDataContext'
import AdminLayout from './pages/admin/AdminLayout.tsx'
import AnalyticsPage from './pages/admin/AnalyticsPage.tsx'
import LogsPage from './pages/admin/LogsPage.tsx'
import ReconciliationPage from './pages/admin/ReconciliationPage.tsx'
import SettingsPage from './pages/admin/SettingsPage.tsx'
import SettlementPage from './pages/admin/SettlementPage.tsx'
import TransactionsPage from './pages/admin/TransactionsPage.tsx'
import LostTicketsPage from './pages/admin/LostTicketsPage.tsx'
import LoginPage from './pages/auth/LoginPage.tsx'
import PayCheckoutPage from './pages/pay/PayCheckoutPage.tsx'
import PayHistoryPage from './pages/pay/PayHistoryPage.tsx'
import PayPaymentPage from './pages/pay/PayPaymentPage.tsx'
import PayScanPage from './pages/pay/PayScanPage.tsx'
import PayShell from './pages/pay/PayShell.tsx'
import PayTicketPage from './pages/pay/PayTicketPage.tsx'
import PayTicketPreviewPage from './pages/pay/PayTicketPreviewPage.tsx'

const Dashboard = lazy(() => import('./pages/admin/Dashboard.tsx'))

export default function App() {
  return (
    <AdminDataProvider>
      <BrowserRouter>
        <AppToaster />
        <NetworkStatusToasts />
        <PwaInstallPrompt />
        <SessionLoginLogger />
        <NavigationLogger />
        <Routes>
          <Route path="/" element={<Navigate to="/pay" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pay" element={<PayShell />}>
            <Route index element={<PayScanPage />} />
            <Route path="scan" element={<PayScanPage />} />
            <Route path="ticket" element={<PayTicketPage />} />
            <Route
              path="ticket/:ticketId/extra/payment"
              element={<PayPaymentPage />}
            />
            <Route path="ticket/:ticketId/extra" element={<PayTicketPreviewPage />} />
            <Route path="ticket/:ticketId/payment" element={<PayPaymentPage />} />
            <Route path="ticket/:ticketId" element={<PayTicketPreviewPage />} />
            <Route path="history" element={<PayHistoryPage />} />
            <Route path="checkout" element={<PayCheckoutPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <Suspense
                  fallback={
                    <SeymourLoadingShell minHeightClass="min-h-[40vh]" />
                  }
                >
                  <Dashboard />
                </Suspense>
              }
            />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="lost-tickets" element={<LostTicketsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settlement" element={<SettlementPage />} />
            <Route path="reconciliation" element={<ReconciliationPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminDataProvider>
  )
}
