import SeymourLogo from '../../components/SeymourLogo'

/** Brand bar on mobile ticket/history — hidden on scan and desktop (shell header). */
export default function PayMobileLogo() {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-5 flex shrink-0 justify-center border-b border-zinc-200/90 bg-white px-4 py-3.5 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_1px_0_rgba(0,0,0,0.04)] lg:hidden">
      <SeymourLogo className="scale-[0.9]" markOnly />
    </header>
  )
}
