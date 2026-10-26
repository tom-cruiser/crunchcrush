import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { formatMoney } from '@/lib/format'

const INK = 'var(--color-ink)'
const AXIS = { fontSize: 12, fill: 'var(--color-ink-soft)' }
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function TooltipBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="font-bold">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-ink-soft">
          {l}
        </p>
      ))}
    </div>
  )
}

export interface DailyPoint {
  date: string
  label: string
  revenue: number
  orders: number
}

/** Revenue per day: one series, so it's titled rather than given a legend. */
export function DailyRevenueChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => compact.format(v)} />
        <Tooltip
          cursor={{ fill: 'var(--color-muted)' }}
          content={({ active, payload }: TooltipContentProps<ValueType, NameType>) =>
            active && payload?.[0] ? (
              <TooltipBox title={(payload[0].payload as DailyPoint).label} lines={[formatMoney((payload[0].payload as DailyPoint).revenue), `${(payload[0].payload as DailyPoint).orders} orders`]} />
            ) : null
          }
        />
        <Bar dataKey="revenue" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PeakHoursChart({ data }: { data: { hour: number; orders: number }[] }) {
  const label = (h: number) => `${String(h).padStart(2, '0')}:00`
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey="hour" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(h: number) => String(h)} interval={1} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--color-muted)' }}
          content={({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
            const p = payload?.[0]?.payload as { hour: number; orders: number } | undefined
            return active && p ? <TooltipBox title={`${label(p.hour)}–${label((p.hour + 1) % 24)}`} lines={[`${p.orders} orders`]} /> : null
          }}
        />
        <Bar dataKey="orders" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Ranked list with a proportional bar; values stay in text ink, the bar only shows magnitude. */
export function RankedBars({ rows, max }: { rows: { key: string; label: string; value: number; detail: string }[]; max: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key} title={`${r.label}: ${r.detail}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold">{r.label}</span>
            <span className="shrink-0 text-ink-soft">{r.detail}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-ink" style={{ width: `${max > 0 && r.value > 0 ? Math.max(2, (r.value / max) * 100) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
