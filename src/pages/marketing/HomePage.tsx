import { Link } from 'react-router-dom'
import PageHero from '../../components/marketing/PageHero'
import PricingShowcase from '../../components/marketing/PricingShowcase'
import SectionHeader from '../../components/marketing/SectionHeader'
import {
  CAR_PARK_INTRO,
  FACILITY_HIGHLIGHTS,
  PARKING_FEATURES,
  SEYMOUR_MISSION,
  SEYMOUR_VISION,
} from '../../lib/marketingContent'
import {
  marketingBtnPrimary,
  marketingBtnSecondary,
  marketingCard,
  marketingContainer,
  marketingGlass,
  marketingSection,
  marketingSectionAlt,
} from '../../lib/marketingUi'
import { useMarketingPricingQuery } from './useMarketingPricing'

const HERO_STATS = [
  { value: '3', label: 'Car park access points' },
  { value: '24/7', label: 'Facility monitoring' },
  { value: 'E-tag', label: 'Smart access system' },
  { value: '100%', label: 'Indigenous owned' },
] as const

const VISION_ICONS = [
  (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" strokeLinecap="round" />
    </svg>
  ),
] as const

function HeroSection() {
  return (
    <PageHero
      eyebrow="MMIA Car Park"
      title={
        <>
          Premium airport parking,
          <span className="block text-orange-200">
            built for modern travel
          </span>
        </>
      }
      description="Seymour Aviation operates a multi-level car park at Murtala Muhammed International Airport, engineered for security, speed, and seamless passenger experience."
      imageUrl="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1920&q=80"
    >
      <Link to="/pay/scan" className={marketingBtnPrimary}>
        Pay for parking
        <span aria-hidden>&rarr;</span>
      </Link>
      <Link to="/pay-info" className={marketingBtnSecondary}>
        View live rates
      </Link>
    </PageHero>
  )
}

function HeroStatsStrip() {
  return (
    <section className="relative z-10 -mt-16 pb-4 sm:-mt-20">
      <div className={marketingContainer}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            >
              <p className="font-display text-3xl font-bold text-link">{stat.value}</p>
              <p className="mt-1 text-sm text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function VisionMissionSection() {
  const cards = [
    { title: 'Vision', body: SEYMOUR_VISION, icon: VISION_ICONS[0] },
    { title: 'Mission', body: SEYMOUR_MISSION, icon: VISION_ICONS[1] },
    { title: 'Car park project', body: CAR_PARK_INTRO, icon: VISION_ICONS[2], link: '/about' },
  ] as const

  return (
    <section className={marketingSection}>
      <div className={marketingContainer}>
        <SectionHeader
          eyebrow="Our purpose"
          title="Why Seymour Aviation leads at MMIA"
          description="A customer-first aviation services company with a national car park landmark at Nigeria's busiest international gateway."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className={`${marketingCard} p-7 sm:p-8`}>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 ring-1 ring-orange-200/60">
                {card.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-zinc-900">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 line-clamp-6">
                {card.body}
              </p>
              {'link' in card && card.link ? (
                <Link
                  to={card.link}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 transition hover:text-orange-900"
                >
                  Read our story <span>&rarr;</span>
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section className={marketingSectionAlt}>
      <div className={marketingContainer}>
        <SectionHeader
          eyebrow="Facilities"
          title="Everything passengers and corporates need"
          description="Drive-in parking, reserved bays, E-tag access, and full vehicle services, all under one roof at MMIA."
        />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {PARKING_FEATURES.map((feature, index) => (
              <div
                key={feature}
                className="group flex items-start gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 transition duration-300 hover:border-orange-200 hover:shadow-lg"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-link text-sm font-bold text-white">
                  {String.fromCharCode(97 + index)}
                </span>
                <p className="pt-1.5 text-sm font-medium leading-relaxed text-zinc-800">
                  {feature}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
            {FACILITY_HIGHLIGHTS.map((item) => (
              <div key={item.title} className={`${marketingGlass} !border-zinc-200/80 !bg-link !text-white`}>
                <p className="font-display text-lg font-bold text-orange-200">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const { data, isLoading, isError } = useMarketingPricingQuery()

  return (
    <section className={marketingSection}>
      <div className={marketingContainer}>
        <SectionHeader
          eyebrow="Live pricing"
          title="Transparent parking rates"
          description="Tariffs by vehicle class, updated automatically."
          action={{ label: 'Pay online', to: '/pay-info' }}
        />

        {isError ? (
          <p className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Pricing service is temporarily unavailable. Displaying the latest known rates.
          </p>
        ) : null}

        <PricingShowcase
          rows={data?.rows ?? []}
          currency={data?.currency}
          loading={isLoading}
        />
      </div>
    </section>
  )
}

function GalleryPreview() {
  const images = [
    {
      src: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
      title: 'Multi-level structure',
      span: 'lg:col-span-7 lg:row-span-2',
    },
    {
      src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
      title: 'Terminal proximity',
      span: 'lg:col-span-5',
    },
    {
      src: 'https://images.unsplash.com/photo-1529078158508-98d22a76ae82?auto=format&fit=crop&w=800&q=80',
      title: 'Passenger flow',
      span: 'lg:col-span-5',
    },
  ] as const

  return (
    <section className="bg-link py-20 text-white sm:py-28">
      <div className={marketingContainer}>
        <SectionHeader
          eyebrow="Gallery"
          title="Inside our facility"
          description="Explore the car park environment and the MMIA experience we support every day."
          action={{ label: 'View full gallery', to: '/gallery' }}
          light
        />

        <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
          {images.map((item) => (
            <Link
              key={item.src}
              to="/gallery"
              className={`group relative overflow-hidden rounded-3xl ${item.span}`}
            >
              <img
                src={item.src}
                alt={item.title}
                className="h-full min-h-[220px] w-full object-cover transition duration-700 group-hover:scale-105 lg:min-h-full"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-link/50" />
              <p className="absolute bottom-5 left-5 font-display text-lg font-bold">{item.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className={`${marketingContainer} py-20 sm:py-28`}>
      <div className="rounded-[2rem] border border-zinc-200 bg-link px-6 py-14 text-center text-white sm:px-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
            Fast checkout
          </p>
          <h2 className="font-display mt-4 text-3xl font-bold sm:text-4xl">
            Pay online before you exit
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
            Scan your ticket QR code or enter your ticket ID. Your fee is calculated
            instantly and you can pay in minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/pay/scan" className={marketingBtnPrimary}>
              Start payment
            </Link>
            <Link to="/contact" className={marketingBtnSecondary}>
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HeroStatsStrip />
      <VisionMissionSection />
      <FeaturesSection />
      <PricingSection />
      <GalleryPreview />
      <CtaSection />
    </>
  )
}
