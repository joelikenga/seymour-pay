import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const COUNTDOWN_START = 5

/**
 * Shown when an admin route is unknown or the signed-in user lacks `pageAccess` for that page.
 * Counts down and returns the user to the dashboard overview.
 */
export default function AdminInaccessibleRoute() {
  const navigate = useNavigate()
  const [sec, setSec] = useState(COUNTDOWN_START)

  useEffect(() => {
    if (sec <= 0) {
      navigate('/admin', { replace: true })
      return
    }
    const id = window.setTimeout(() => setSec((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [sec, navigate])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-7xl font-black tabular-nums tracking-tight text-zinc-200">404</p>
      <p className="mt-4 text-lg font-semibold text-zinc-900">Page not found</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
        This page is not available, or you do not have permission to open it.
      </p>
      <p className="mt-10 text-sm text-zinc-500">
        Returning to the dashboard overview in{' '}
        <span className="font-semibold tabular-nums text-zinc-800">{Math.max(0, sec)}</span>s…
      </p>
    </div>
  )
}
