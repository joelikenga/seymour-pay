import { useEffect, useMemo, useState } from 'react'
import { DISPLAY_TIMEZONE } from '../../lib/formatters'

interface OverviewClockProps {
  className?: string
}

export default function OverviewClock({ className }: OverviewClockProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const { timeStr, dateLabel } = useMemo(() => {
    const timeStr = new Intl.DateTimeFormat('en-NG', {
      timeZone: DISPLAY_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(now)

    const dateLabel = new Intl.DateTimeFormat('en-NG', {
      timeZone: DISPLAY_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now)

    return { timeStr, dateLabel }
  }, [now])

  return (
    <div
      className={`rounded-2xl border border-zinc-200/90 bg-white/90 px-5 py-3 text-center shadow-sm ring-1 ring-zinc-950/5 backdrop-blur-sm ${className ?? ''}`}
      role="timer"
      aria-label={`Nigeria time ${timeStr}, ${dateLabel}`}
    >
      {/* <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Nigeria (WAT · Lagos)
      </p> */}
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-zinc-950 sm:text-[1.65rem]">
        {timeStr}
      </p>
      <p className="mt-1 text-xs leading-snug text-zinc-500">{dateLabel}</p>
    </div>
  )
}
