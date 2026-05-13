import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminProfileQuery } from '../../query/adminProfile'
import { pathnameToAdminPageKey } from '../../lib/adminRoutePageKey'
import AdminInaccessibleRoute from './AdminInaccessibleRoute'

function SessionShellLoader() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center px-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700"
        aria-hidden
      />
    </div>
  )
}

/**
 * Enforces `profile.pageAccess` for nested `/admin/*` routes. Does not mount child routes until
 * the session profile exists, so restricted pages never flash on reload. Unknown or denied paths
 * show {@link AdminInaccessibleRoute} (404 + countdown to dashboard).
 */
export default function AdminPageAccessOutlet() {
  const location = useLocation()
  const { data: profile, isPending, isError } = useAdminProfileQuery()
  const page = pathnameToAdminPageKey(location.pathname)

  if (!profile) {
    if (isError) {
      return <Navigate to="/login" replace />
    }
    if (isPending) {
      return <SessionShellLoader />
    }
    // Settled without a usable profile (e.g. empty `/me` body)
    return <Navigate to="/login" replace />
  }

  if (page === null) {
    return <AdminInaccessibleRoute />
  }
  if (!profile.pageAccess[page]) {
    return <AdminInaccessibleRoute />
  }

  return <Outlet />
}
