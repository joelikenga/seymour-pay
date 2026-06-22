import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppToaster } from './components/AppToaster'
import SeymourLoadingShell from './components/SeymourLoadingShell'
import { NetworkStatusToasts } from './components/NetworkStatusToasts'
import NavigationLogger from './components/admin/NavigationLogger'
import PwaPayScopeGuard from './components/PwaPayScopeGuard'
import SessionLoginLogger from './components/admin/SessionLoginLogger'
import { AdminDataProvider } from './context/AdminDataContext'
import PayCheckoutPage from './pages/pay/PayCheckoutPage.tsx'
import PayHistoryPage from './pages/pay/PayHistoryPage.tsx'
import PayPaymentPage from './pages/pay/PayPaymentPage.tsx'
import PayScanPage from './pages/pay/PayScanPage.tsx'
import PayShell from './pages/pay/PayShell.tsx'
import PayTicketPage from './pages/pay/PayTicketPage.tsx'
import PayTicketPreviewPage from './pages/pay/PayTicketPreviewPage.tsx'
import MarketingLayout from './pages/marketing/MarketingLayout.tsx'

const Dashboard = lazy(() => import('./pages/admin/Dashboard.tsx'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.tsx'))
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage.tsx'))
const LogsPage = lazy(() => import('./pages/admin/LogsPage.tsx'))
const ReconciliationPage = lazy(() => import('./pages/admin/ReconciliationPage.tsx'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage.tsx'))
const SettlementPage = lazy(() => import('./pages/admin/SettlementPage.tsx'))
const TransactionsPage = lazy(() => import('./pages/admin/TransactionsPage.tsx'))
const LostTicketsPage = lazy(() => import('./pages/admin/LostTicketsPage.tsx'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage.tsx'))
const HomePage = lazy(() => import('./pages/marketing/HomePage.tsx'))
const AboutPage = lazy(() => import('./pages/marketing/AboutPage.tsx'))
const ContactPage = lazy(() => import('./pages/marketing/ContactPage.tsx'))
const GalleryPage = lazy(() => import('./pages/marketing/GalleryPage.tsx'))
const PayInfoPage = lazy(() => import('./pages/marketing/PayInfoPage.tsx'))

function PageFallback() {
  return <SeymourLoadingShell minHeightClass="min-h-[50vh]" />
}

export default function App() {
  return (
    <AdminDataProvider>
      <BrowserRouter>
        <AppToaster />
        <NetworkStatusToasts />
        <PwaPayScopeGuard />
        <SessionLoginLogger />
        <NavigationLogger />
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <HomePage />
                </Suspense>
              }
            />
            <Route
              path="about"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AboutPage />
                </Suspense>
              }
            />
            <Route
              path="contact"
              element={
                <Suspense fallback={<PageFallback />}>
                  <ContactPage />
                </Suspense>
              }
            />
            <Route
              path="gallery"
              element={
                <Suspense fallback={<PageFallback />}>
                  <GalleryPage />
                </Suspense>
              }
            />
            <Route
              path="pay-info"
              element={
                <Suspense fallback={<PageFallback />}>
                  <PayInfoPage />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="/login"
            element={
              <Suspense fallback={<PageFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
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
          <Route
            path="/admin"
            element={
              <Suspense fallback={<PageFallback />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="transactions"
              element={
                <Suspense fallback={<PageFallback />}>
                  <TransactionsPage />
                </Suspense>
              }
            />
            <Route
              path="lost-tickets"
              element={
                <Suspense fallback={<PageFallback />}>
                  <LostTicketsPage />
                </Suspense>
              }
            />
            <Route
              path="analytics"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AnalyticsPage />
                </Suspense>
              }
            />
            <Route
              path="logs"
              element={
                <Suspense fallback={<PageFallback />}>
                  <LogsPage />
                </Suspense>
              }
            />
            <Route
              path="settlement"
              element={
                <Suspense fallback={<PageFallback />}>
                  <SettlementPage />
                </Suspense>
              }
            />
            <Route
              path="reconciliation"
              element={
                <Suspense fallback={<PageFallback />}>
                  <ReconciliationPage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminDataProvider>
  )
}
