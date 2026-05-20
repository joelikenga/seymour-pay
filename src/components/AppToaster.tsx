import { Toaster } from 'sonner'

/**
 * Global toast host - glass surface, orange/zinc palette aligned with admin shell.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      offset={20}
      gap={12}
      duration={5000}
      visibleToasts={5}
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group pointer-events-auto relative flex w-[min(100vw-2rem,26rem)] items-start gap-3 rounded-2xl border p-4 pr-11 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.38)] backdrop-blur-xl ring-1 transition-[transform,opacity] data-[swipe=true]:opacity-95',
          content: 'min-w-0 flex-1 pt-0.5',
          title:
            'text-[15px] font-semibold leading-snug tracking-tight text-zinc-950',
          description: 'mt-1 text-sm leading-relaxed text-zinc-600',
          closeButton:
            'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200/90 bg-white/90 text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800',
          icon: 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-inner ring-1 ring-zinc-200/90',
          success:
            'border-emerald-200/95 bg-linear-to-br from-emerald-50/95 via-white to-white ring-emerald-600/12',
          error:
            'border-rose-200/95 bg-linear-to-br from-rose-50/95 via-white to-white ring-rose-600/12',
          warning:
            'border-amber-200/95 bg-linear-to-br from-amber-50/95 via-white to-white ring-amber-600/12',
          info: 'border-sky-200/95 bg-linear-to-br from-sky-50/95 via-white to-white ring-sky-600/12',
          default:
            'border-zinc-200/95 bg-linear-to-br from-white via-orange-50/25 to-zinc-50/90 ring-zinc-950/8',
        },
      }}
      icons={{
        success: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-emerald-600"
            aria-hidden
          >
            <path
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        error: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-rose-600"
            aria-hidden
          >
            <path
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        warning: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-amber-600"
            aria-hidden
          >
            <path
              d="M12 9v4m0 4h.01M12 3 2 21h20L12 3z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        info: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-sky-600"
            aria-hidden
          >
            <path
              d="m11.25 11.25.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      }}
    />
  )
}
