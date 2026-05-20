import { Link } from 'react-router-dom'
import SeymourLogo from '../../components/SeymourLogo'

/** Fixed top brand bar on mobile manual entry + history (overlay inside PayShell outlet). */
export default function PayMobileTopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 border-b border-zinc-200/80 bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden">
      <div className="pointer-events-auto flex min-h-14 items-center justify-center px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          to="/pay/ticket"
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
          aria-label="Seymour Aviation pay"
        >
          <SeymourLogo className="max-w-[min(100%,200px)]" />
        </Link>
      </div>
    </header>
  )
}
