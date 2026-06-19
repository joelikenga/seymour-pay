import { Outlet } from 'react-router-dom'
import MarketingFooter from '../../components/marketing/MarketingFooter'
import MarketingHeader from '../../components/marketing/MarketingHeader'

export default function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 antialiased">
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  )
}
