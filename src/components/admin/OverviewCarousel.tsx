import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  channelChartHex,
  channelLabel,
} from '../../lib/channelStyles'
import {
  OVERVIEW_PAYMENT_TYPES,
  monthlyChannelCounts,
  todayChannelCounts,
  weekdayChannelCounts,
} from '../../lib/dashboardStats'
import { formatMoney } from '../../lib/formatters'
import type { PaymentChannel, Transaction } from '../../types/transaction'

const ROTATE_MS = 6000
const PANEL_MIN_HEIGHT = 'min-h-[260px] sm:min-h-[280px]'

function ChartSlot({
  active,
  children,
  minClassName = 'min-h-[180px] sm:min-h-[200px]',
}: {
  active: boolean
  children: ReactNode
  minClassName?: string
}) {
  if (active) return <>{children}</>
  return (
    <div
      className={`mt-3 ${minClassName} rounded-xl bg-zinc-50/40 ring-1 ring-zinc-100/80`}
      aria-hidden
    />
  )
}

export interface OverviewCarouselProps {
  /** Headline slide content — full width of the slot. */
  totalAmount: number
  totalAmountText: string
  totalCount: number
  channelsUsed: number
  /** Week-over-week % change (null when not enough history). */
  wow: number | null
  transactions: Transaction[]
}

interface SlideMeta {
  id: 'total' | 'today' | 'week' | 'month'
  label: string
}

const SLIDES: SlideMeta[] = [
  { id: 'total', label: 'Total volume' },
  { id: 'today', label: 'Payments today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This year' },
]

export default function OverviewCarousel(props: OverviewCarouselProps) {
  const {
    totalAmount,
    totalAmountText,
    totalCount,
    channelsUsed,
    wow,
    transactions,
  } = props

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackId = useId()

  const goTo = useCallback((i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused])

  return (
    <div
      className="relative min-w-0 w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Overview highlights"
    >
      <div className="overflow-hidden">
        <div
          id={trackId}
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          aria-live="polite"
        >
          <SlideShell active={index === 0} label={SLIDES[0].label}>
            <TotalVolumeSlide
              amount={totalAmount}
              amountText={totalAmountText}
              totalCount={totalCount}
              channelsUsed={channelsUsed}
              wow={wow}
            />
          </SlideShell>
          <SlideShell active={index === 1} label={SLIDES[1].label}>
            <TodayChannelSlide active={index === 1} transactions={transactions} />
          </SlideShell>
          <SlideShell active={index === 2} label={SLIDES[2].label}>
            <WeekdayChannelSlide active={index === 2} transactions={transactions} />
          </SlideShell>
          <SlideShell active={index === 3} label={SLIDES[3].label}>
            <MonthlyChannelSlide active={index === 3} transactions={transactions} />
          </SlideShell>
        </div>
      </div>

      <CarouselDots
        index={index}
        total={SLIDES.length}
        onSelect={goTo}
        trackId={trackId}
      />
    </div>
  )
}

interface SlideShellProps {
  active: boolean
  label: string
  children: React.ReactNode
}

function SlideShell({ active, label, children }: SlideShellProps) {
  return (
    <div
      className={`w-full shrink-0 ${PANEL_MIN_HEIGHT}`}
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!active}
      inert={!active}
    >
      {children}
    </div>
  )
}

interface CarouselDotsProps {
  index: number
  total: number
  onSelect: (i: number) => void
  trackId: string
}

function CarouselDots({ index, total, onSelect, trackId }: CarouselDotsProps) {
  return (
    <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Carousel slides">
      {Array.from({ length: total }, (_, i) => {
        const active = i === index
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={trackId}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onSelect(i)}
            className={`h-1.5 rounded-full transition-all ${
              active
                ? 'w-7 bg-zinc-900'
                : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'
            }`}
          />
        )
      })}
    </div>
  )
}

interface TotalVolumeSlideProps {
  amount: number
  amountText: string
  totalCount: number
  channelsUsed: number
  wow: number | null
}

function TotalVolumeSlide({
  amount,
  amountText,
  totalCount,
  channelsUsed,
  wow,
}: TotalVolumeSlideProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Total payment volume
      </p>
      <p
        className="mt-1 min-w-0 max-w-full wrap-break-word bg-linear-to-br from-zinc-950 to-zinc-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl md:leading-[1.08]"
        aria-label={`Total payment volume ${formatMoney(amount)}`}
      >
        {amountText}
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        Shows total transaction revenue.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
          {9999}+ records
        </span>
        <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
          {channelsUsed} payment {channelsUsed === 1 ? 'type' : 'types'} used
        </span>
        {wow != null ? (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tabular-nums ${
              wow >= 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {wow >= 0 ? '↑' : '↓'} {Math.abs(wow).toFixed(1)}% WoW
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500">
            WoW — need more history
          </span>
        )}
      </div>
    </div>
  )
}

interface SlideHeaderProps {
  eyebrow: string
  title: string
  subtitle: string
}

function SlideHeader({ eyebrow, title, subtitle }: SlideHeaderProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {eyebrow}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
        {title}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  )
}

function tooltipStyle(): React.CSSProperties {
  return {
    borderRadius: 12,
    border: '1px solid #e4e4e7',
    boxShadow: '0 12px 40px -12px rgba(15,23,42,0.18)',
    fontSize: 12,
  }
}

function legendFormatter(value: unknown): string {
  return channelLabel[value as PaymentChannel] ?? String(value)
}

function txCountLabel(value: unknown, name: unknown): [string, string] {
  const n = typeof value === 'number' ? value : Number(value ?? 0)
  const ch = name as PaymentChannel
  return [`${n} tx`, channelLabel[ch] ?? String(name ?? '')]
}

function todayBarLabel(value: unknown): [string, string] {
  const n = typeof value === 'number' ? value : Number(value ?? 0)
  return [`${n} tx`, 'Today']
}

function TodayChannelSlide({
  active,
  transactions,
}: {
  active: boolean
  transactions: Transaction[]
}) {
  const data = useMemo(
    () =>
      todayChannelCounts(transactions).map((row) => ({
        label: channelLabel[row.channel],
        channel: row.channel,
        count: row.count,
      })),
    [transactions],
  )
  const total = useMemo(
    () => data.reduce((a, r) => a + r.count, 0),
    [data],
  )

  return (
    <div className="flex h-full flex-col">
      <SlideHeader
        eyebrow="Today's payments"
        title="Payments by type today"
        subtitle={`${total} ${total === 1 ? 'transaction' : 'transactions'} taken today across cash, POS, transfer, e-payment and USSD`}
      />
      <ChartSlot active={active}>
        <div className="mt-3 -mx-2 h-[180px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <BarChart
              data={data}
              barCategoryGap="38%"
              margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#52525b' }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
                height={26}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#71717a' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: 'rgba(244,244,245,0.6)' }}
                formatter={todayBarLabel}
                contentStyle={tooltipStyle()}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={14}>
                {data.map((row) => (
                  <Cell key={row.channel} fill={channelChartHex[row.channel]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartSlot>
    </div>
  )
}

function WeekdayChannelSlide({
  active,
  transactions,
}: {
  active: boolean
  transactions: Transaction[]
}) {
  const data = useMemo(
    () => (active ? weekdayChannelCounts(transactions) : []),
    [active, transactions],
  )

  return (
    <div className="flex h-full flex-col">
      <SlideHeader
        eyebrow="This week's traffic"
        title="Payments by weekday"
        subtitle="Transactions per payment type, Mon → Sun (current week)"
      />
      <ChartSlot active={active} minClassName="min-h-[200px] sm:min-h-[210px]">
        <div className="mt-3 -mx-2 h-[200px] sm:h-[210px]">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <LineChart
              data={data}
              margin={{ top: 14, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#52525b' }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
                height={26}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#71717a' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={tooltipStyle()}
                formatter={txCountLabel}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={7}
                wrapperStyle={{
                  paddingTop: 4,
                  fontSize: 11,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '4px 12px',
                }}
                formatter={legendFormatter}
              />
              {OVERVIEW_PAYMENT_TYPES.map((ch) => (
                <Line
                  key={ch}
                  type="linear"
                  dataKey={ch}
                  name={ch}
                  stroke={channelChartHex[ch]}
                  strokeWidth={2}
                  dot={{ r: 2.5, strokeWidth: 0, fill: channelChartHex[ch] }}
                  activeDot={{ r: 4, strokeWidth: 0, fill: channelChartHex[ch] }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartSlot>
    </div>
  )
}

function MonthlyChannelSlide({
  active,
  transactions,
}: {
  active: boolean
  transactions: Transaction[]
}) {
  const year = new Date().getFullYear()
  const data = useMemo(
    () => (active ? monthlyChannelCounts(transactions, year) : []),
    [active, transactions, year],
  )

  return (
    <div className="flex h-full flex-col">
      <SlideHeader
        eyebrow={`${year}`}
        title="Payments by month"
        subtitle={`Transactions per payment type, January → December ${year}`}
      />
      <ChartSlot active={active} minClassName="min-h-[200px] sm:min-h-[210px]">
        <div className="mt-3 -mx-2 h-[200px] sm:h-[210px]">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <LineChart
              data={data}
              margin={{ top: 14, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#52525b' }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
                height={26}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#71717a' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={tooltipStyle()}
                formatter={txCountLabel}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={7}
                wrapperStyle={{
                  paddingTop: 4,
                  fontSize: 11,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '4px 12px',
                }}
                formatter={legendFormatter}
              />
              {OVERVIEW_PAYMENT_TYPES.map((ch) => (
                <Line
                  key={ch}
                  type="linear"
                  dataKey={ch}
                  name={ch}
                  stroke={channelChartHex[ch]}
                  strokeWidth={2}
                  dot={{ r: 2, strokeWidth: 0, fill: channelChartHex[ch] }}
                  activeDot={{ r: 4, strokeWidth: 0, fill: channelChartHex[ch] }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartSlot>
    </div>
  )
}
