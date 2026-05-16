import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import SeymourLogo from '../../components/SeymourLogo'
import {
  DESKTOP_MEDIA,
  isPayCheckoutStep,
  isPayTicketDetailsStep,
  PAY_SHELL_INNER,
  PAY_SHELL_OUTER,
  PAY_TICKET_ID_PARAM,
} from './payFlowShared'

const safeAreaPad = {
  paddingLeft: 'env(safe-area-inset-left, 0px)',
  paddingRight: 'env(safe-area-inset-right, 0px)',
} as const

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
    isActive
      ? 'bg-white text-orange-600 shadow-sm ring-1 ring-zinc-900/8'
      : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900'
  }`
}

function mobileNavClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-0 flex-1 items-center justify-center rounded-lg font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
    isActive
      ? 'bg-white px-3.5 py-2.5 text-orange-600 shadow-sm'
      : 'flex-col gap-px px-1.5 py-1.5 text-[10px] text-zinc-400 hover:text-white'
  }`
}

type MobilePayNavLinkProps = {
  to: string
  end?: boolean
  label: string
  icon: ReactNode
}

function MobilePayNavLink({ to, end, label, icon }: MobilePayNavLinkProps) {
  return (
    <NavLink to={to} end={end} className={mobileNavClass}>
      {({ isActive }) => (
        <>
          {icon}
          <span className={isActive ? 'sr-only' : undefined}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function PayShell() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isPaymentFlow = isPayCheckoutStep(searchParams)
  const isTicketDetails =
    (pathname === '/pay' || pathname === '/pay/') &&
    isPayTicketDetailsStep(searchParams)
  const isPayIndex = pathname === '/pay' || pathname === '/pay/'
  const hasTicketId = Boolean(searchParams.get(PAY_TICKET_ID_PARAM)?.trim())
  const isScanCamera = isPayIndex && !hasTicketId
  const hideShellNav = isPaymentFlow || isTicketDetails
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA).matches,
  )
  const isFocusedPayFlow = (isPaymentFlow || isTicketDetails) && !isDesktop

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA)
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const shellOuterClass =
    isScanCamera && !isDesktop
      ? `${PAY_SHELL_OUTER} max-lg:items-stretch max-lg:bg-black max-lg:sm:p-0`
      : PAY_SHELL_OUTER

  const shellInnerClass =
    isScanCamera && !isDesktop
      ? 'relative flex h-screen max-h-screen min-h-dvh w-full max-w-none flex-col overflow-hidden bg-black max-lg:sm:h-screen max-lg:sm:max-h-screen max-lg:sm:rounded-none max-lg:sm:shadow-none max-lg:sm:ring-0'
      : isFocusedPayFlow
        ? 'relative flex min-h-dvh w-full max-w-none flex-col overflow-hidden bg-zinc-100 max-lg:rounded-none max-lg:shadow-none max-lg:ring-0'
        : `relative ${PAY_SHELL_INNER}`

  return (
    <div className={shellOuterClass}>
      <div className={shellInnerClass} style={safeAreaPad}>
        {!hideShellNav ? (
          <header className="hidden shrink-0 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:border-b lg:border-zinc-200/90 lg:bg-white lg:px-8 lg:py-4">
            <SeymourLogo className="scale-95" />
            <nav
              className="flex rounded-xl bg-zinc-200/60 p-1 shadow-inner ring-1 ring-zinc-950/5"
              aria-label="Pay navigation"
            >
              <NavLink to="/pay/ticket" className={navLinkClass}>
                Enter ticket
              </NavLink>
              <NavLink to="/pay/history" className={navLinkClass}>
                History
              </NavLink>
            </nav>
          </header>
        ) : null}

        <div
          className={
            isScanCamera && !isDesktop
              ? 'relative h-screen min-h-0 flex-1'
              : 'relative flex min-h-0 flex-1 flex-col'
          }
        >
          <Outlet />
        </div>

        {!hideShellNav && !isDesktop ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
            <nav
              className="pointer-events-auto flex w-full max-w-[260px] gap-0.5 rounded-2xl border border-white/12 bg-zinc-950/65 p-1 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.65)] backdrop-blur-xl"
              aria-label="Pay navigation"
            >
              <MobilePayNavLink to="/pay" end label="Scan" icon={<QrScanIcon />} />
              <MobilePayNavLink to="/pay/ticket" label="Ticket" icon={<TicketIcon />} />
              <MobilePayNavLink to="/pay/history" label="History" icon={<HistoryIcon />} />
            </nav>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function QrScanIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
      />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6M7 4h10a1 1 0 0 1 1 1v14l-4-2-4 2-4-2V5a1 1 0 0 1 1-1Z"
      />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l2.5 2.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
      />
    </svg>
  )
}
