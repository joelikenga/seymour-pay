import PageHero from '../../components/marketing/PageHero'
import AmenitiesShowcase from '../../components/marketing/AmenitiesShowcase'
import SectionHeader from '../../components/marketing/SectionHeader'
import {
  CAR_PARK_INTRO,
  PARKING_FEATURES,
  SEYMOUR_ABOUT,
  SEYMOUR_MISSION,
  SEYMOUR_VISION,
} from '../../lib/marketingContent'
import {
  marketingCard,
  marketingContainer,
  marketingSection,
  marketingSectionAlt,
} from '../../lib/marketingUi'

export default function AboutPage() {
  return (
    <>
      <PageHero
        compact
        eyebrow="About Us"
        title="Seymour Aviation Limited"
        description={SEYMOUR_ABOUT}
        imageUrl="https://images.unsplash.com/photo-1464037866551-5662778c6e58?auto=format&fit=crop&w=1920&q=80"
      />

      <section className={marketingSection}>
        <div className={marketingContainer}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeader
                eyebrow="Our story"
                title="A national milestone at MMIA"
                description="Supporting FAAN's vision of a world-class West African aviation hub."
              />
              <p className="-mt-8 text-base leading-relaxed text-zinc-600">{CAR_PARK_INTRO}</p>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                We consider the MMIA car park project a major milestone for the country
                and a source of national pride. Our facility supports passengers,
                tourists, and corporates with reliable parking and vehicle services at
                Nigeria&apos;s premier international gateway.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-[0_24px_80px_rgba(15,23,42,0.15)]">
                <img
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
                  alt="Aircraft at an international airport"
                  className="aspect-[4/5] w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-orange-200/80 bg-white p-5 shadow-xl sm:-left-8">
                <p className="font-display text-3xl font-bold text-link">2008</p>
                <p className="mt-1 text-sm text-zinc-600">Incorporated as a 100% indigenous company</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={marketingSectionAlt}>
        <div className={marketingContainer}>
          <div className="grid gap-6 md:grid-cols-2">
            <article className={`${marketingCard} p-8`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Vision</p>
              <h3 className="font-display mt-3 text-2xl font-bold text-zinc-900">Looking forward</h3>
              <p className="mt-4 leading-relaxed text-zinc-600">{SEYMOUR_VISION}</p>
            </article>
            <article className={`${marketingCard} p-8`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Mission</p>
              <h3 className="font-display mt-3 text-2xl font-bold text-zinc-900">How we serve</h3>
              <p className="mt-4 leading-relaxed text-zinc-600">{SEYMOUR_MISSION}</p>
            </article>
          </div>
        </div>
      </section>

      <section className={marketingSection}>
        <div className={marketingContainer}>
          <SectionHeader
            eyebrow="Services"
            title="Our car park capabilities"
            description="End-to-end facility management for individuals, corporates, and airport visitors."
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {PARKING_FEATURES.map((feature, i) => (
              <li
                key={feature}
                className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm transition hover:border-orange-200 hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-zinc-800">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={marketingSectionAlt}>
        <div className={marketingContainer}>
          <SectionHeader
            eyebrow="Amenities"
            title="Building and passenger amenities"
            description="Elevators, climate-controlled waiting areas, safety systems, and terminal skywalks for a world-class airport experience."
          />
          <AmenitiesShowcase />
        </div>
      </section>
    </>
  )
}
