import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isPwaStandalone } from '../lib/pwaInstall'

/** In installed PWA mode, keep users on pay routes only (scan and checkout). */
export default function PwaPayScopeGuard() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPwaStandalone()) return
    if (pathname.startsWith('/pay')) return
    navigate('/pay/scan', { replace: true })
  }, [navigate, pathname])

  return null
}
