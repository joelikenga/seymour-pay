import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import PwaInstallButton from '../PwaInstallButton'
import SeymourLogo from '../SeymourLogo'
import { marketingBtnPrimary, marketingContainer } from '../../lib/marketingUi'

const NAV_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/pay-info', label: 'Pay' },
  { to: '/contact', label: 'Contact' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `relative rounded-full px-4 py-2 text-sm font-medium transition duration-300 ${
    isActive
      ? 'bg-link text-white shadow-md'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
  }`
}

export default function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-zinc-200/80 bg-white/90 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl'
            : 'border-b border-transparent bg-white/70 backdrop-blur-md'
        }`}
      >
        <div className={`${marketingContainer} flex items-center justify-between gap-4 py-3.5`}>
          <Link
            to="/"
            className="shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            onClick={() => setMenuOpen(false)}
          >
            <SeymourLogo />
          </Link>

          <nav
            className="hidden items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-50/80 p-1.5 md:flex"
            aria-label="Main"
          >
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <PwaInstallButton variant="header" />
            <Link to="/pay/scan" className={`${marketingBtnPrimary} !px-5 !py-2.5 !text-xs sm:!text-sm`}>
              Pay now
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-link/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="marketing-mobile-menu absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col bg-white p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <SeymourLogo />
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-base font-semibold ${
                      isActive
                        ? 'bg-orange-50 text-orange-800'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <PwaInstallButton variant="header" className="mt-6 w-full justify-center" />
            <Link
              to="/pay/scan"
              onClick={() => setMenuOpen(false)}
              className={`${marketingBtnPrimary} mt-auto w-full`}
            >
              Pay now
            </Link>
          </div>
        </div>
      ) : null}
    </>
  )
}
