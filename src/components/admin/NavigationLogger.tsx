import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAdminData } from '../../context/AdminDataContext'
import { getAuditActorLabel } from '../../lib/auditActorLabel'

function payNavigationTitle(pathname: string): string {
  if (pathname === '/pay/history') return 'Pay - History'
  if (pathname === '/pay/ticket') return 'Pay - Enter ticket'
  if (pathname === '/pay/checkout') return 'Pay - Checkout'
  if (pathname === '/pay' || pathname === '/pay/scan') return 'Pay - Scan'
  if (/\/extra\/payment$/.test(pathname)) return 'Pay - Extra payment'
  if (/\/payment$/.test(pathname)) return 'Pay - Payment'
  if (/\/extra$/.test(pathname)) return 'Pay - Extra preview'
  if (pathname.startsWith('/pay/ticket/')) return 'Pay - Ticket preview'
  return pathname
}

const titles: Record<string, string> = {
  '/login': 'Login',
  '/pay': 'Pay - Scan',
  '/pay/scan': 'Pay - Scan',
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

    const title = titles[location.pathname] ?? payNavigationTitle(location.pathname)
    appendLog({
      action: 'navigation',
      summary: `Opened ${title}`,
      detail: `${who} navigated to ${path}`,
    })
  }, [location.pathname, location.search, appendLog])

  return null
}
