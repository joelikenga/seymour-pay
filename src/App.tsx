import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import NavigationLogger from './components/admin/NavigationLogger'
import PwaInstallPrompt from './components/PwaInstallPrompt.tsx'
import SessionLoginLogger from './components/admin/SessionLoginLogger'
import { AdminDataProvider } from './context/AdminDataContext'
import AdminLayout from './pages/admin/AdminLayout.tsx'
import AnalyticsPage from './pages/admin/AnalyticsPage.tsx'
import LogsPage from './pages/admin/LogsPage.tsx'
import ReconciliationPage from './pages/admin/ReconciliationPage.tsx'
import SettlementPage from './pages/admin/SettlementPage.tsx'
import TransactionsPage from './pages/admin/TransactionsPage.tsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.tsx'
import LoginPage from './pages/auth/LoginPage.tsx'

const Dashboard = lazy(() => import('./pages/admin/Dashboard.tsx'))

export default function App() {
  return (
    <AdminDataProvider>
      <BrowserRouter>
        <PwaInstallPrompt />
        <SessionLoginLogger />
        <NavigationLogger />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <Suspense
                  fallback={
                    <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-zinc-500">
                      Loading overview…
                    </div>
                  }
                >
                  <Dashboard />
                </Suspense>
              }
            />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settlement" element={<SettlementPage />} />
            <Route path="reconciliation" element={<ReconciliationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminDataProvider>
  )
}
