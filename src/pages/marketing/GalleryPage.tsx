import { useEffect, useState } from 'react'
import PageHero from '../../components/marketing/PageHero'
import { GALLERY_ITEMS } from '../../lib/marketingContent'
import { marketingContainer, marketingSection } from '../../lib/marketingUi'

const BENTO_SPANS = [
  'sm:col-span-2 sm:row-span-2',
  '',
  '',
  'sm:col-span-2',
  '',
  '',
] as const

export default function GalleryPage() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeItem = GALLERY_ITEMS.find((item) => item.id === activeId)

  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId])

  return (
    <>
      <PageHero
        compact
        eyebrow="Gallery"
        title="Our facility & MMIA"
        description="A visual tour of the car park and the airport environment we operate within every day."
        imageUrl="https://images.unsplash.com/photo-1529078158508-98d22a76ae82?auto=format&fit=crop&w=1920&q=80"
      />

      <section className={marketingSection}>
        <div className={marketingContainer}>
          <div className="grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY_ITEMS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`group relative overflow-hidden rounded-3xl text-left border border-zinc-200 shadow-sm transition duration-300 hover:border-orange-200 hover:shadow-md ${BENTO_SPANS[index] ?? ''}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-link/55" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-display text-lg font-bold text-white sm:text-xl">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-white/75 line-clamp-2">{item.caption}</p>
                </div>
                <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition group-hover:bg-orange-500">
                  +
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-link/90 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          onClick={() => setActiveId(null)}
        >
          <div
            className="marketing-fade-up max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeItem.imageUrl.replace('w=1200', 'w=1800')}
              alt={activeItem.title}
              className="max-h-[72vh] w-full object-cover"
            />
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-zinc-900">{activeItem.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">{activeItem.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
