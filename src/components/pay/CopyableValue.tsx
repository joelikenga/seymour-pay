import { useCallback, useState } from 'react'
import { toast } from 'sonner'

type CopyableValueProps = {
  value: string
  label?: string
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-600" aria-hidden>
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-zinc-500" aria-hidden>
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function CopyableValue({ value, label = 'Account number' }: CopyableValueProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Account number copied')
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      toast.error('Could not copy', {
        description: 'Allow clipboard access or copy manually.',
      })
    }
  }, [value])

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="flex w-full flex-col items-center rounded-xl border border-zinc-200 bg-white px-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20"
      aria-label={`Copy ${label}`}
    >
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className="mt-2 flex items-center gap-2">
        <span className="font-mono text-xl font-semibold tabular-nums tracking-wide text-zinc-950 sm:text-2xl">
          {value}
        </span>
        <CopyIcon copied={copied} />
      </span>
      <span className="mt-2 text-xs text-zinc-400">{copied ? 'Copied' : 'Click to copy'}</span>
    </button>
  )
}
