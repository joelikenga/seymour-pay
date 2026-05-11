import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import DashboardOverviewSkeleton, {
  CustomerTrafficChartSkeleton,
} from '../../components/admin/DashboardOverviewSkeleton'
import AdminTableSkeletonBody from '../../components/admin/AdminTableSkeletonBody'
import OverviewMonthCalendar from '../../components/admin/OverviewMonthCalendar'
import OverviewCarousel from '../../components/admin/OverviewCarousel'
import ChangePasswordModal from '../../components/admin/ChangePasswordModal'
import OverviewClock from '../../components/admin/OverviewClock'
import { SEYMOUR_ADMIN_TAB_SESSION_KEY } from '../../components/admin/SessionLoginLogger.tsx'
import { VehicleTypeIconBadge } from '../../components/admin/VehicleTypeGlyph'
import fidelityLogo from '../../assets/Fidelity_Bank_Plc_Main_Logo.svg'
import { useAdminData } from '../../context/AdminDataContext'
import { emptyOverviewDashboardStats } from '../../lib/dashboardStats'
import { useAdminProfileQuery } from '../../query/adminProfile'
import { useDashboardOverviewQuery } from '../../query/dashboardOverview'
import { performAdminLogout } from '../../utils/adminAuth'
import {
  channelChartHex,
  channelLabel,
  channelPillClass,
} from '../../lib/channelStyles'
import {
  VEHICLE_TYPES,
  vehicleLabel,
  vehicleParkingRates,
  vehiclePillClass,
} from '../../lib/vehicleStyles'
import {
  formatDateShort,
  formatMoney,
  formatMoneyAbbreviated,
} from '../../lib/formatters'
import { useRecentTransactionsQuery } from '../../query/transactionsList'
import type { PaymentChannel, TransactionStatus } from '../../types/transaction'

const ORANGE = '#ea580c'

const STATUS_SEGMENTS: { key: TransactionStatus; label: string; bar: string }[] = [
  { key: 'completed', label: 'Completed', bar: 'bg-emerald-500' },
  { key: 'pending', label: 'Pending', bar: 'bg-amber-400' },
  { key: 'failed', label: 'Failed', bar: 'bg-rose-500' },
]

const OPS_PROFILE = {
  name: 'Seymour Ops',
  email: 'ops@seymouraviation.ng',
  initials: 'SO',
} as const

function CustomerTrafficTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ value?: unknown }>
  label?: ReactNode
}) {
  if (!active || !payload?.length) return null
  const raw = payload[0]?.value
  const n = typeof raw === 'number' ? raw : Number(raw ?? 0)
  return (
    <div
      className="rounded-[14px] px-4 py-3 text-sm shadow-[0_16px_48px_rgba(0,0,0,0.25)]"
      style={{
        background: '#18181b',
        border: 'none',
      }}
    >
      <p className="text-[11px] font-medium" style={{ color: '#a1a1aa' }}>
        {label}
      </p>
      <p className="mt-1 font-semibold tabular-nums text-white">
        {n} {n === 1 ? 'customer' : 'customers'}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { appendLog } = useAdminData()
  const overviewQuery = useDashboardOverviewQuery()
  const profileQuery = useAdminProfileQuery()
  const me = profileQuery.data
  const profileName = me?.displayName ?? OPS_PROFILE.name
  const profileEmail = me?.email ?? OPS_PROFILE.email
  const profileInitials = me?.initials ?? OPS_PROFILE.initials
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const generatedAvatarUrl = useMemo(
    () =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=ea580c&color=fff&size=128&rounded=true`,
    [profileName],
  )
  const avatarUrl = me?.photoUrl ?? generatedAvatarUrl
  useEffect(() => {
    setAvatarFailed(false)
  }, [me?.photoUrl, profileName])
  const onAvatarError = useCallback(() => setAvatarFailed(true), [])
  const handleLogout = useCallback(async () => {
    await performAdminLogout()
    sessionStorage.removeItem(SEYMOUR_ADMIN_TAB_SESSION_KEY)
    appendLog({
      action: 'navigation',
      summary: 'Signed out',
      detail: 'Admin signed out from the dashboard',
    })
    navigate('/login', { replace: true })
  }, [appendLog, navigate])
  const stats = overviewQuery.data ?? emptyOverviewDashboardStats()
  const overviewLoading = overviewQuery.isPending

  const recentQuery = useRecentTransactionsQuery()
  const recentRows = recentQuery.data?.data ?? []

  return (
    <div className="space-y-8 pb-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-linear-to-r from-white via-orange-50/20 to-zinc-50/90 px-5 py-4 shadow-sm ring-1 ring-zinc-950/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-800/85">
          Seymour Aviation Car Park
        </p>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-end rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 sm:self-auto">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live operations
        </span>
      </section>

      {overviewLoading ? (
        <DashboardOverviewSkeleton />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[3fr_2fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] ring-1 ring-zinc-950/4 sm:p-8">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-200/60 to-transparent"
              aria-hidden
            />
            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-6">
              <div className="min-w-0">
                <OverviewCarousel
                  totalAmount={stats.grand}
                  totalAmountText={formatMoneyAbbreviated(stats.grand)}
                  totalCount={stats.totalCount}
                  channelsUsed={stats.channelsUsed}
                  wow={stats.wow}
                  transactions={[]}
                />
              </div>

              <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-2xl border border-zinc-100 bg-linear-to-b from-orange-50/80 to-white p-3.5 ring-1 ring-orange-100/80 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800/70">
                    Today
                  </p>
                  <p
                    className="mt-1 min-w-0 wrap-break-word text-sm font-bold leading-tight text-zinc-950 sm:mt-1.5 sm:text-base md:text-lg"
                    title={formatMoney(stats.today)}
                  >
                    {formatMoneyAbbreviated(stats.today)}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {stats.todayLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5 ring-1 ring-zinc-100 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Yesterday
                  </p>
                  <p
                    className="mt-1 min-w-0 wrap-break-word text-sm font-bold leading-tight text-zinc-950 sm:mt-1.5 sm:text-base md:text-lg"
                    title={formatMoney(stats.yesterday)}
                  >
                    {formatMoneyAbbreviated(stats.yesterday)}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {stats.yesterdayLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-100/90 bg-sky-50/40 p-3.5 ring-1 ring-sky-100/60 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-900/75">
                    This week
                  </p>
                  <p
                    className="mt-1 min-w-0 wrap-break-word text-sm font-bold leading-tight text-zinc-950 sm:mt-1.5 sm:text-base md:text-lg"
                    title={formatMoney(stats.weekToDate)}
                  >
                    {formatMoneyAbbreviated(stats.weekToDate)}
                  </p>
                  <p className="mt-1 text-[11px] text-sky-900/75">
                    {stats.weekLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100/90 bg-emerald-50/40 p-3.5 ring-1 ring-emerald-100/60 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/75">
                    This month
                  </p>
                  <p
                    className="mt-1 min-w-0 wrap-break-word text-sm font-bold leading-tight text-zinc-950 sm:mt-1.5 sm:text-base md:text-lg"
                    title={formatMoney(stats.monthToDate)}
                  >
                    {formatMoneyAbbreviated(stats.monthToDate)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-900/80">
                    {stats.monthLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-100 pt-7">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                    Volume by settlement state
                  </p>

                </div>
              </div>
              {(() => {
                const visibleTotal = STATUS_SEGMENTS.reduce(
                  (a, { key }) => a + stats.byStatus[key].volume,
                  0,
                )
                if (visibleTotal <= 0) {
                  return (
                    <p className="mt-4 text-sm text-zinc-500">
                      No transactions yet — volume breakdown will appear here.
                    </p>
                  )
                }
                return (
                  <>
                    <div
                      className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/90"
                      role="img"
                      aria-label="Share of volume by transaction status"
                    >
                      {STATUS_SEGMENTS.map(({ key, bar }) => {
                        const vol = stats.byStatus[key].volume
                        const pct = (vol / visibleTotal) * 100
                        if (pct <= 0) return null
                        return (
                          <div
                            key={key}
                            title={`${key}: ${formatMoney(vol)}`}
                            className={`${bar} h-full min-w-px shrink-0 first:rounded-l-full last:rounded-r-full`}
                            style={{ width: `${pct}%` }}
                          />
                        )
                      })}
                    </div>
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      {STATUS_SEGMENTS.map(({ key, label }) => {
                        const row = stats.byStatus[key]
                        if (row.volume <= 0) return null
                        const pct = Math.round((row.volume / visibleTotal) * 100)
                        return (
                          <li key={key} className="flex items-baseline gap-2">
                            <span className="font-semibold capitalize text-zinc-700">
                              {label}
                            </span>
                            <span className="font-bold tabular-nums text-zinc-900">
                              {formatMoney(row.volume)}
                            </span>
                            <span className="text-zinc-400">({pct}%)</span>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )
              })()}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-zinc-100 pt-8">
              <Link
                to="/admin/transactions"
                className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800"
              >
                All transactions
              </Link>
              <Link
                to="/admin/settlement"
                className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50/80 px-5 py-2.5 text-sm font-semibold text-sky-950 shadow-sm transition hover:border-sky-300 hover:bg-sky-100/80"
              >
                Settlement
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-1">
            <section className="group relative overflow-hidden rounded-[1.75rem] border border-sky-200/70 bg-linear-to-br from-sky-50/90 via-white to-white p-6 shadow-[0_16px_48px_-36px_rgba(14,165,233,0.28)] ring-1 ring-sky-950/5 transition hover:shadow-lg hover:ring-sky-200/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-inner ring-1 ring-sky-200/80">
                    <img
                      src={fidelityLogo}
                      alt="Fidelity Bank Plc"
                      className="h-full w-full object-contain object-center"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-sky-900/85">
                      Fidelity Bank Plc
                    </p>
                    <p className="text-sm leading-snug text-sky-900/70">
                      Pay provider · POS, transfer, e-pay & USSD
                    </p>
                  </div>
                </div>
              </div>
              <FidelityChannelMix mix={stats.fidelityMix} />
            </section>

            <section className="group relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-linear-to-br from-white via-zinc-50/50 to-orange-50/25 p-6 shadow-[0_16px_48px_-36px_rgba(15,23,42,0.22)] ring-1 ring-zinc-950/5 transition hover:border-orange-100/80 hover:shadow-lg hover:ring-orange-100/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-800/75">
                Account security
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
                Change password
              </h3>
              <p className="mt-1 text-sm leading-snug text-zinc-600">
                Update your admin credentials with a strong password.
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-[#ea580c] to-orange-600 shadow-md ring-2 ring-white/40">
                  <div
                    className="absolute inset-0 flex items-center justify-center text-lg font-bold tracking-tight text-white"
                    aria-hidden
                  >
                    {profileInitials}
                  </div>
                  {!avatarFailed ? (
                    <img
                      src={avatarUrl}
                      alt={profileName}
                      width={64}
                      height={64}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={onAvatarError}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-zinc-950">{profileName}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">{profileEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ea580c] to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-900/20 transition hover:brightness-[1.03] active:scale-[0.99]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M15.75 5.25a3 3 0 013 3m3 0a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12V13.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Change password
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Log out
              </button>
            </section>
          </div>
        </div>
      )}

      {/* Middle grid — items-start so calendar column height fits its contents */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <section className="lg:col-span-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1 w-6 rounded-full bg-orange-400/80" aria-hidden />
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Car types
              </h3>
            </div>
            <div className="space-y-3">
              {VEHICLE_TYPES.map((vehicleType) => {
                const { defaultRate, extraHourRate } =
                  vehicleParkingRates[vehicleType]
                return (
                  <div
                    key={vehicleType}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-linear-to-r from-white to-zinc-50/80 p-4 shadow-sm ring-1 ring-zinc-950/3 transition hover:border-orange-100 hover:shadow-md"
                  >
                    <VehicleTypeIconBadge
                      type={vehicleType}
                      title={vehicleLabel[vehicleType]}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${vehiclePillClass[vehicleType]}`}
                      >
                        {vehicleLabel[vehicleType]}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold tabular-nums text-zinc-900">
                        {formatMoney(defaultRate)}
                      </span>
                      <span className="text-[11px] font-medium tabular-nums text-zinc-500">
                        extra hour {formatMoney(extraHourRate)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-orange-500" aria-hidden />
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Customer traffic
            </h2>
          </div>
          {overviewLoading ? (
            <CustomerTrafficChartSkeleton />
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_12px_40px_-32px_rgba(15,23,42,0.2)] ring-1 ring-zinc-950/[0.03]">
              <div className="rounded-2xl bg-linear-to-b from-zinc-50/90 to-white p-4 ring-1 ring-zinc-100">
                <div className="h-[240px] w-full sm:h-[260px] md:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.customerTraffic}
                      barCategoryGap="38%"
                      margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e4e4e7"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#71717a' }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis allowDecimals={false} hide />
                      <Tooltip
                        cursor={{ fill: 'rgba(254,243,232,0.45)' }}
                        content={<CustomerTrafficTooltip />}
                      />
                      <Bar
                        dataKey="count"
                        fill={ORANGE}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={14}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-orange-500" aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Calendar
            </h3>
          </div>
          <div className="flex h-fit w-full flex-col gap-4">
            <OverviewClock className="w-full shrink-0" />
            <OverviewMonthCalendar />
          </div>
        </aside>
      </div>

      {/* Latest five transactions */}
      <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] ring-1 ring-zinc-950/4">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-100 bg-linear-to-r from-white via-orange-50/20 to-zinc-50/90 px-6 py-6 md:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-1 w-6 shrink-0 rounded-full bg-orange-500" aria-hidden />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Recent transactions
              </p>
            </div>
          </div>
          <Link
            to="/admin/transactions"
            className="shrink-0 text-sm font-semibold text-orange-700 underline-offset-4 hover:text-orange-800 hover:underline"
          >
            View Transactions
          </Link>
        </div>

        <div
          className="overflow-x-auto"
          aria-busy={recentQuery.isPending}
        >
          <table
            className="w-full min-w-[720px] border-collapse text-left text-sm"
            aria-label={
              recentQuery.isPending
                ? 'Loading recent transactions'
                : 'Recent transactions'
            }
          >
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/98 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="whitespace-nowrap px-6 py-4 md:px-8">Ticket ID</th>
                <th className="whitespace-nowrap px-6 py-4 md:px-8">Vehicle</th>
                <th className="whitespace-nowrap px-6 py-4 md:px-8">Payment type</th>
                <th className="whitespace-nowrap px-6 py-4 text-right md:px-8">Amount</th>
                <th className="whitespace-nowrap px-6 py-4 md:px-8">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentQuery.isPending ? (
                <AdminTableSkeletonBody
                  rows={5}
                  columns={5}
                  rightAlignIndices={[3]}
                  tdClassName="whitespace-nowrap px-6 py-4 md:px-8"
                />
              ) : recentQuery.isError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-rose-700 md:px-8"
                  >
                    Could not load latest transactions.
                  </td>
                </tr>
              ) : (
                recentRows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition hover:bg-orange-50/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-[13px] text-zinc-900 md:px-8">
                      {row.reference}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 md:px-8">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${vehiclePillClass[row.vehicleType]}`}
                      >
                        {vehicleLabel[row.vehicleType]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 md:px-8">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${channelPillClass[row.channel]}`}
                      >
                        {channelLabel[row.channel]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums text-zinc-950 md:px-8">
                      {formatMoney(row.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 tabular-nums text-zinc-600 md:px-8">
                      {formatDateShort(row.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
      />
    </div>
  )
}

interface FidelityChannelMixProps {
  mix: { channel: PaymentChannel; count: number; pct: number }[]
}

function FidelityChannelMix({ mix }: FidelityChannelMixProps) {
  const total = mix.reduce((a, r) => a + r.count, 0)

  if (total === 0) {
    return (
      <p className="mt-5 text-sm text-zinc-500">
        No card or transfer payments yet
      </p>
    )
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-900/75">
        Payment mix · share of use
      </p>
      <ul className="divide-y divide-sky-100/80 rounded-2xl bg-white/70 ring-1 ring-sky-100/80">
        {mix.map(({ channel, count, pct }) => {
          const display = pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`
          return (
            <li
              key={channel}
              className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-zinc-700"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: channelChartHex[channel] }}
                  aria-hidden
                />
                <span className="truncate">{channelLabel[channel]}</span>
              </div>
              <span className="tabular-nums text-zinc-900">
                {display}
                <span className="ml-1.5 font-medium text-zinc-500">
                  · {count}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
