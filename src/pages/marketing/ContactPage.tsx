import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import PageHero from '../../components/marketing/PageHero'
import { SEYMOUR_CONTACT } from '../../lib/marketingContent'
import {
  marketingBtnPrimary,
  marketingCard,
  marketingContainer,
  marketingInput,
  marketingSection,
} from '../../lib/marketingUi'

const CONTACT_CHANNELS = [
  {
    label: 'Phone',
    value: SEYMOUR_CONTACT.phone,
    href: SEYMOUR_CONTACT.phoneHref,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Email',
    value: SEYMOUR_CONTACT.email,
    href: SEYMOUR_CONTACT.emailHref,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 7 10-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Location',
    value: SEYMOUR_CONTACT.location,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    ),
  },
] as const

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setSubmitting(true)
    window.setTimeout(() => {
      setSubmitting(false)
      toast.success('Thank you. Your message has been received. We will respond shortly.')
      form.reset()
    }, 800)
  }

  return (
    <>
      <PageHero
        compact
        eyebrow="Contact"
        title="We're here to help"
        description="Questions about corporate parking, E-tag access, or online payments? Reach our team directly."
        imageUrl="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1920&q=80"
      />

      <section className={marketingSection}>
        <div className={marketingContainer}>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              {CONTACT_CHANNELS.map((channel) => (
                <article key={channel.label} className={`${marketingCard} p-6`}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                      {channel.icon}
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                        {channel.label}
                      </p>
                      {'href' in channel && channel.href ? (
                        <a
                          href={channel.href}
                          className="mt-2 block text-lg font-semibold text-link hover:text-link-hover"
                        >
                          {channel.value}
                        </a>
                      ) : (
                        <p className="mt-2 text-sm leading-relaxed text-zinc-700">{channel.value}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className={`${marketingCard} p-7 lg:col-span-7 lg:p-10`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                Message us
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold text-zinc-900">
                Send a message
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Our team typically responds within one business day.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-700">
                  First name
                  <input required name="firstName" className={marketingInput} />
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  Last name
                  <input required name="lastName" className={marketingInput} />
                </label>
              </div>

              <label className="mt-5 block text-sm font-medium text-zinc-700">
                Email
                <input required type="email" name="email" className={marketingInput} />
              </label>

              <label className="mt-5 block text-sm font-medium text-zinc-700">
                Message
                <textarea
                  required
                  name="message"
                  rows={5}
                  className={`${marketingInput} !h-auto resize-y py-3`}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className={`${marketingBtnPrimary} mt-8 disabled:opacity-60`}
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
