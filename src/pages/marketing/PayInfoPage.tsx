import { Link } from 'react-router-dom'
import PageHero from '../../components/marketing/PageHero'
import PricingShowcase from '../../components/marketing/PricingShowcase'
import SectionHeader from '../../components/marketing/SectionHeader'
import {
  marketingBtnOutline,
  marketingBtnPrimary,
  marketingCard,
  marketingContainer,
  marketingSection,
  marketingSectionAlt,
} from '../../lib/marketingUi'
import { useMarketingPricingQuery } from './useMarketingPricing'

const PAY_STEPS = [
  {
    step: '01',
    title: 'Scan or enter ticket',
    description: 'Use your parking ticket QR code or type your ticket ID on the pay page.',
  },
  {
    step: '02',
    title: 'Review your fee',
    description: 'Your fee is calculated based on vehicle type and parking duration.',
  },
  {
    step: '03',
    title: 'Pay & exit',
    description: 'Complete payment by card or bank transfer, then proceed to exit within the grace period.',
  },
] as const

export default function PayInfoPage() {
  const { data, isFetching, isError, error } = useMarketingPricingQuery()

  return (
    <>
      <PageHero
        compact
        eyebrow="Pay"
        title="Rates & online payment"
        description="View live car park tariffs and pay for your ticket online before leaving MMIA."
        imageUrl="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1920&q=80"
      >
        <Link to="/pay/scan" className={marketingBtnPrimary}>
          Pay for my ticket
        </Link>
      </PageHero>

      <section className={marketingSection}>
        <div className={marketingContainer}>
          <SectionHeader
            eyebrow="Tariffs"
            title="Current parking prices"
          />

          {isError ? (
            <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
              {error instanceof Error
                ? error.message
                : 'Unable to load live pricing right now.'}
            </p>
          ) : null}

          <PricingShowcase
            rows={data?.rows ?? []}
            currency={data?.currency}
            loading={isFetching && !data}
          />
        </div>
      </section>

      <section className={marketingSectionAlt}>
        <div className={marketingContainer}>
          <SectionHeader
            eyebrow="How it works"
            title="Three steps to pay"
            description="Fast, secure checkout designed for passengers on the move."
            align="center"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {PAY_STEPS.map((item) => (
              <article key={item.step} className={`${marketingCard} p-7`}>
                <span className="font-display text-4xl font-bold text-orange-200">{item.step}</span>
                <h3 className="font-display mt-4 text-xl font-bold text-zinc-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link to="/pay/scan" className={marketingBtnPrimary}>
              Scan QR code
            </Link>
            <Link to="/pay/ticket" className={marketingBtnOutline}>
              Enter ticket ID
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
