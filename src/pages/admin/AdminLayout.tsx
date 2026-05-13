import { useCallback } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import SeymourLogo from '../../components/SeymourLogo'
import { SEYMOUR_ADMIN_TAB_SESSION_KEY } from '../../components/admin/SessionLoginLogger.tsx'
import { useAdminData } from '../../context/AdminDataContext'
import { performAdminLogout } from '../../utils/adminAuth'
import { hasAdminToken } from '../../utils/cookies'

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/settlement', label: 'Settlement' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/logs', label: 'Logs' },
  { to: '/admin/reconciliation', label: 'Reconciliation' },
  { to: '/admin/settings', label: 'Settings' },
] as const

export default function AdminLayout() {
  const navigate = useNavigate()
  const { appendLog } = useAdminData()

  const handleLogout = useCallback(async () => {
    await performAdminLogout()
    sessionStorage.removeItem(SEYMOUR_ADMIN_TAB_SESSION_KEY)
    appendLog({
      action: 'navigation',
      summary: 'Signed out',
      detail: 'Admin signed out from the console',
    })
    navigate('/login', { replace: true })
  }, [appendLog, navigate])

  if (!hasAdminToken()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-svh bg-[#f4f7f6] font-sans text-zinc-900 antialiased">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-4 md:px-8">
          <Link
            to="/admin"
            className="min-w-0 rounded-xl outline-none ring-zinc-950/10 focus-visible:ring-4 focus-visible:ring-link/35"
            aria-label="Seymour Aviation — Dashboard"
          >
            <SeymourLogo className="max-w-[min(100%,200px)] sm:max-w-[min(100%,240px)]" />
          </Link>

          <nav
            className="hidden items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-50/80 p-1 shadow-inner md:flex"
            aria-label="Main"
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition lg:px-5 ${
                    isActive
                      ? 'bg-primary-soft/38 text-link-hover shadow-sm ring-1 ring-primary-soft/55'
                      : 'text-link hover:bg-primary-soft/14 hover:text-link-hover'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex shrink-0 items-center gap-2 rounded-full border border-link/25 bg-white px-3 py-2 text-sm font-semibold text-link shadow-sm transition hover:border-link/40 hover:bg-primary-soft/14 hover:text-link-hover active:scale-[0.99] sm:px-4"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        <div className="border-t border-zinc-100 md:hidden">
          <nav
            aria-label="Main"
            className="-mx-px flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden"
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-primary-soft/38 text-link-hover shadow-sm ring-1 ring-primary-soft/55'
                      : 'border border-zinc-200/80 bg-zinc-50 text-link hover:border-link/30 hover:bg-primary-soft/14 hover:text-link-hover'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
