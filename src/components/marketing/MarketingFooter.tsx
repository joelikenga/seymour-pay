import { Link } from 'react-router-dom'
import SeymourLogo from '../SeymourLogo'
import { SEYMOUR_CONTACT } from '../../lib/marketingContent'
import { marketingContainer } from '../../lib/marketingUi'

const FOOTER_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/pay-info', label: 'Pay & Rates' },
  { to: '/contact', label: 'Contact' },
] as const

export default function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-link text-white">

      <div className={`relative ${marketingContainer} py-16 sm:py-20`}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <SeymourLogo className="brightness-0 invert" />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
              Indigenous pacesetter in aviation logistics and facility management.
              Operating Nigeria&apos;s premier multi-level car park at MMIA, Lagos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={SEYMOUR_CONTACT.phoneHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-300" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Call us
              </a>
              <Link
                to="/pay/scan"
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                Pay online
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                Explore
              </h2>
              <ul className="mt-5 space-y-3">
                {FOOTER_LINKS.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-white/75 transition hover:text-white hover:underline hover:underline-offset-4"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                Contact
              </h2>
              <ul className="mt-5 space-y-4 text-sm text-white/75">
                <li>
                  <p className="text-xs uppercase tracking-wide text-white/45">Phone</p>
                  <a href={SEYMOUR_CONTACT.phoneHref} className="mt-1 block font-medium text-white hover:text-orange-200">
                    {SEYMOUR_CONTACT.phone}
                  </a>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-wide text-white/45">Email</p>
                  <a href={SEYMOUR_CONTACT.emailHref} className="mt-1 block font-medium text-white hover:text-orange-200">
                    {SEYMOUR_CONTACT.email}
                  </a>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-wide text-white/45">Location</p>
                  <p className="mt-1 leading-relaxed">{SEYMOUR_CONTACT.location}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <p className={`${marketingContainer} py-6 text-center text-xs text-white/50`}>
          &copy; {new Date().getFullYear()} Seymour Aviation Limited. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
