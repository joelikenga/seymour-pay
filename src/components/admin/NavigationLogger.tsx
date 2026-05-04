import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAdminData } from '../../context/AdminDataContext'

const titles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/transactions': 'Transactions',
  '/admin/analytics': 'Analytics',
  '/admin/logs': 'Activity log',
  '/admin/settlement': 'Settlement',
  '/admin/reconciliation': 'Reconciliation',
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

    const title = titles[location.pathname] ?? location.pathname
    appendLog({
      action: 'navigation',
      summary: `Opened ${title}`,
      detail: `Navigated to ${path}`,
    })
  }, [location.pathname, location.search, appendLog])

  return null
}
