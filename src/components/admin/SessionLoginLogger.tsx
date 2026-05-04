import { useEffect, useRef } from 'react'
import { useAdminData } from '../../context/AdminDataContext'

export const SEYMOUR_ADMIN_TAB_SESSION_KEY = 'seymour_audit_login_logged'

/** One login event per browser tab session (demo). */
export default function SessionLoginLogger() {
  const { appendLog } = useAdminData()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (sessionStorage.getItem(SEYMOUR_ADMIN_TAB_SESSION_KEY)) return
    sessionStorage.setItem(SEYMOUR_ADMIN_TAB_SESSION_KEY, '1')
    appendLog({
      action: 'login',
      summary: 'Signed in',
      detail: 'Session started as Seymour Ops (demo user)',
    })
  }, [appendLog])

  return null
}
