import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAdminData } from '../../context/AdminDataContext'
import { getAuditActorLabel } from '../../lib/auditActorLabel'

const titles: Record<string, string> = {
  '/login': 'Login',
  '/pay': 'Pay - Scan',
  '/pay/ticket': 'Pay - Enter ticket',
  '/pay/history': 'Pay - History',
  '/pay/checkout': 'Pay - Checkout',
  '/admin': 'Dashboard',
  '/admin/transactions': 'Transactions',
  '/admin/analytics': 'Analytics',
  '/admin/logs': 'Activity log',
  '/admin/settlement': 'Settlement',
  '/admin/reconciliation': 'Reconciliation',
  '/admin/settings': 'Settings',
}

let dedupe: { path: string; t: number } | null = null

export default function NavigationLogger() {
  const location = useLocation()
  const { appendLog } = useAdminData()

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`
    const now = Date.now()
    if (dedupe && dedupe.path === path && now - dedupe.t < 400) return
    dedupe = { path, t: now }

    const who = getAuditActorLabel()

    if (location.pathname === '/admin/logs') {
      appendLog({
        action: 'navigation',
        summary: `${who} navigated to logs page`,
        detail: `${who} navigated to logs page`,
      })
      return
    }

    const title = titles[location.pathname] ?? location.pathname
    appendLog({
      action: 'navigation',
      summary: `Opened ${title}`,
      detail: `${who} navigated to ${path}`,
    })
  }, [location.pathname, location.search, appendLog])

  return null
}
