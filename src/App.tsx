import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import NavigationLogger from './components/admin/NavigationLogger'
import PwaInstallPrompt from './components/PwaInstallPrompt.tsx'
import SessionLoginLogger from './components/admin/SessionLoginLogger'
import { AdminDataProvider } from './context/AdminDataContext'
import AdminLayout from './pages/admin/AdminLayout.tsx'
import AnalyticsPage from './pages/admin/AnalyticsPage.tsx'
import Dashboard from './pages/admin/Dashboard.tsx'
import LogsPage from './pages/admin/LogsPage.tsx'
import ReconciliationPage from './pages/admin/ReconciliationPage.tsx'
import SettlementPage from './pages/admin/SettlementPage.tsx'
import TransactionsPage from './pages/admin/TransactionsPage.tsx'

export default function App() {
  return (
    <AdminDataProvider>
      <BrowserRouter>
        <PwaInstallPrompt />
        <SessionLoginLogger />
        <NavigationLogger />
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settlement" element={<SettlementPage />} />
            <Route path="reconciliation" element={<ReconciliationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminDataProvider>
  )
}
