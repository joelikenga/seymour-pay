import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { channelLabel } from '../../lib/channelStyles'
import { formatMoney } from '../../lib/formatters'
import type { PaymentChannel } from '../../types/transaction'

export interface ChartPoint {
  label: string
  amount: number
}

export type MultiChartRow = { label: string } & Partial<
  Record<PaymentChannel, number>
>

type PropsSingle = {
  mode?: 'single'
  data: ChartPoint[]
  color: string
  /** Overrides default fixed chart height (e.g. tall analytics layout). */
  chartContainerClassName?: string
}

type PropsMulti = {
  mode: 'multi'
  data: MultiChartRow[]
  channels: PaymentChannel[]
  colors: Record<PaymentChannel, string>
  chartContainerClassName?: string
}

export type ChannelVolumeChartProps = PropsSingle | PropsMulti

function sanitizeId(raw: string): string {
  return raw.replace(/:/g, '')
}

function SingleVolumeChart({
  data,
  color,
  chartContainerClassName,
}: {
  data: ChartPoint[]
  color: string
  chartContainerClassName?: string
}) {
  const gid = sanitizeId(useId())
  const boxClass =
    chartContainerClassName ??
    'h-[268px] w-full min-h-[240px] sm:h-[292px]'

  return (
    <div className={boxClass}>
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <AreaChart
          data={data}
          margin={{ top: 14, right: 10, left: 4, bottom: 6 }}
        >
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e4e4e7"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickLine={false}
            axisLine={{ stroke: '#e4e4e7' }}
            interval="preserveStartEnd"
            height={28}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) =>
              typeof v === 'number' && v >= 1000
                ? `${Math.round(v / 1000)}k`
                : String(v ?? '')
            }
          />
          <Tooltip
            formatter={(value) =>
              typeof value === 'number' ? formatMoney(value) : ''
            }
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e4e4e7',
              boxShadow: '0 10px 40px -12px rgba(15,23,42,0.15)',
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function MultiVolumeChart({
  data,
  channels,
  colors,
  chartContainerClassName,
}: {
  data: MultiChartRow[]
  channels: PaymentChannel[]
  colors: Record<PaymentChannel, string>
  chartContainerClassName?: string
}) {
  const baseId = sanitizeId(useId())
  const boxClass =
    chartContainerClassName ??
    'h-[320px] min-h-[300px] w-full sm:h-[340px]'

  return (
    <div className={boxClass}>
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <AreaChart
          data={data}
          margin={{ top: 14, right: 10, left: 4, bottom: 4 }}
        >
          <defs>
            {channels.map((ch) => {
              const c = colors[ch]
              const gid = `${baseId}-${ch}`
              return (
                <linearGradient key={ch} id={gid} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.02} />
                </linearGradient>
              )
            })}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e4e4e7"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickLine={false}
            axisLine={{ stroke: '#e4e4e7' }}
            interval="preserveStartEnd"
            height={28}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) =>
              typeof v === 'number' && v >= 1000
                ? `${Math.round(v / 1000)}k`
                : String(v ?? '')
            }
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e4e4e7',
              boxShadow: '0 12px 40px -12px rgba(15,23,42,0.18)',
              maxWidth: 280,
            }}
            formatter={(value, name) => {
              const ch = name as PaymentChannel
              return [
                typeof value === 'number' ? formatMoney(value) : '',
                channelLabel[ch] ?? String(name),
              ]
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '6px 12px',
              paddingTop: 10,
              width: '100%',
              fontSize: 11,
            }}
            iconType="circle"
            iconSize={7}
            formatter={(value) => channelLabel[value as PaymentChannel] ?? value}
          />
          {channels.map((ch) => {
            const c = colors[ch]
            const gid = `${baseId}-${ch}`
            return (
              <Area
                key={ch}
                type="monotone"
                dataKey={ch}
                name={ch}
                stroke={c}
                strokeWidth={2}
                fill={`url(#${gid})`}
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: c }}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ChannelVolumeChart(props: ChannelVolumeChartProps) {
  if (props.mode === 'multi') {
    return (
      <MultiVolumeChart
        data={props.data}
        channels={props.channels}
        colors={props.colors}
        chartContainerClassName={props.chartContainerClassName}
      />
    )
  }
  return (
    <SingleVolumeChart
      data={props.data}
      color={props.color}
      chartContainerClassName={props.chartContainerClassName}
    />
  )
}
