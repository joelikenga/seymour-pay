import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom'
import SeymourLogo from '../../components/SeymourLogo'
import AdminPageAccessOutlet from '../../components/admin/AdminPageAccessOutlet'
import { SEYMOUR_ADMIN_TAB_SESSION_KEY } from '../../components/admin/SessionLoginLogger.tsx'
import { useAdminData } from '../../context/AdminDataContext'
import { useAdminPageAccess } from '../../hooks/useAdminPageAccess'
import { ADMIN_APP_NAV } from '../../lib/adminRoutePageKey'
import type { AdminPageKey } from '../../types/adminUser'
import { performAdminLogout } from '../../utils/adminAuth'
import { hasAdminToken } from '../../utils/cookies'

const NAV_ICONS: Record<AdminPageKey, React.ReactNode> = {
  dashboard: (
    <path
      d="M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  transactions: (
    <path
      d="M4 6h16M4 12h16M4 18h10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  settlement: (
    <path
      d="M3 8h18v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 0V6a1 1 0 011-1h16a1 1 0 011 1v2M12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  analytics: (
    <path
      d="M4 20V10m6 10V4m6 16v-7m4 7H2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  logs: (
    <path
      d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm8 0v4h4M9.5 12h5m-5 4h5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  reconciliation: (
    <path
      d="M4 7h12m0 0l-3-3m3 3l-3 3m7 7H8m0 0l3 3m-3-3l3-3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  settings: (
    <path
      d="M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.5-2-3.5-2.4 1a7.6 7.6 0 00-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 00-2 1.2l-2.4-1-2 3.5 2 1.5a7.4 7.4 0 000 2.4l-2 1.5 2 3.5 2.4-1a7.6 7.6 0 002 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 002-1.2l2.4 1 2-3.5-2-1.5c.07-.4.1-.8.1-1.2z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  ),
}

function NavItemIcon({ page }: { page: AdminPageKey }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      {NAV_ICONS[page]}
    </svg>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { appendLog } = useAdminData()
  const { profile } = useAdminPageAccess()

  /** Desktop rail: collapsed (icons only) by default; click to slide out. */
  const [expanded, setExpanded] = useState(false)
  /** Mobile: off-canvas drawer. */
  const [mobileOpen, setMobileOpen] = useState(false)

  /** Do not render any route labels until `pageAccess` is known (avoids flashing full nav on reload). */
  const visibleNav = useMemo(() => {
    if (!profile) return []
    return ADMIN_APP_NAV.filter((item) => profile.pageAccess[item.page])
  }, [profile])

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

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  if (!hasAdminToken()) {
    return <Navigate to="/login" replace />
  }

  const navItems = (onNavigate?: () => void, showLabels = true) =>
    visibleNav.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={'end' in item ? item.end : false}
        title={showLabels ? undefined : item.label}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            isActive
              ? 'bg-primary-soft/38 text-link-hover shadow-sm ring-1 ring-primary-soft/55'
              : 'text-link hover:bg-primary-soft/14 hover:text-link-hover'
          } ${showLabels ? '' : 'justify-center px-0'}`
        }
      >
        <NavItemIcon page={item.page} />
        {showLabels ? (
          <span className="truncate whitespace-nowrap">{item.label}</span>
        ) : (
          <span className="sr-only">{item.label}</span>
        )}
      </NavLink>
    ))

  return (
    <div className="flex min-h-svh bg-[#f4f7f6] font-sans text-zinc-900 antialiased">
      {/* Desktop sidebar - icon rail that slides out on toggle */}
      <aside
        className={`sticky top-0 z-40 hidden h-svh shrink-0 flex-col border-r border-zinc-200/80 bg-white/95 shadow-[1px_0_0_rgba(0,0,0,0.04)] backdrop-blur-md transition-[width] duration-300 ease-in-out md:flex ${
          expanded ? 'w-60' : 'w-17'
        }`}
        aria-label="Sidebar"
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-zinc-100 ${
            expanded ? 'justify-between px-3' : 'justify-center px-0'
          }`}
        >
          {expanded ? (
            <Link
              to="/admin"
              className="min-w-0 rounded-xl px-1 outline-none focus-visible:ring-4 focus-visible:ring-link/35"
              aria-label="Seymour Aviation - Dashboard"
            >
              <SeymourLogo className="max-w-[150px]" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-link shadow-sm transition hover:border-link/30 hover:bg-primary-soft/14 hover:text-link-hover"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              aria-hidden
            >
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <nav
          aria-label="Main"
          className={`flex flex-1 flex-col gap-1 overflow-y-auto py-3 ${
            expanded ? 'px-3' : 'px-2.5'
          }`}
        >
          {navItems(undefined, expanded)}
        </nav>

        <div
          className={`shrink-0 border-t border-zinc-100 py-3 ${expanded ? 'px-3' : 'px-2.5'}`}
        >
          <button
            type="button"
            onClick={handleLogout}
            title={expanded ? undefined : 'Logout'}
            aria-label="Log out"
            className={`flex w-full items-center gap-3 rounded-xl border border-link/25 bg-white py-2.5 text-sm font-semibold text-link shadow-sm transition hover:border-link/40 hover:bg-primary-soft/14 hover:text-link-hover active:scale-[0.99] ${
              expanded ? 'px-3' : 'justify-center px-0'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {expanded ? <span>Logout</span> : <span className="sr-only">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/45 backdrop-blur-[1px] md:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200/80 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 px-3">
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="min-w-0 rounded-xl px-1 outline-none focus-visible:ring-4 focus-visible:ring-link/35"
            aria-label="Seymour Aviation - Dashboard"
          >
            <SeymourLogo className="max-w-[150px]" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav
          aria-label="Main"
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3"
        >
          {navItems(() => setMobileOpen(false))}
        </nav>
        <div className="shrink-0 border-t border-zinc-100 px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex w-full items-center gap-3 rounded-xl border border-link/25 bg-white px-3 py-2.5 text-sm font-semibold text-link shadow-sm transition hover:border-link/40 hover:bg-primary-soft/14 hover:text-link-hover active:scale-[0.99]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar - hamburger + logo on mobile only */}
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md md:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-link shadow-sm transition hover:border-link/30 hover:bg-primary-soft/14"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <Link
                to="/admin"
                className="min-w-0 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-link/35"
                aria-label="Seymour Aviation - Dashboard"
              >
                <SeymourLogo className="max-w-[min(100%,180px)]" />
              </Link>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex shrink-0 items-center gap-2 rounded-full border border-link/25 bg-white px-3 py-2 text-sm font-semibold text-link shadow-sm transition hover:border-link/40 hover:bg-primary-soft/14 hover:text-link-hover active:scale-[0.99]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8">
          <AdminPageAccessOutlet />
        </main>
      </div>
    </div>
  )
}
