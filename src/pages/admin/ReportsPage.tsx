import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { reportsApi } from '@/api'
import { Button, Card, EmptyState, ErrorState, Input, Skeleton } from '@/components/ui'
import { DailyRevenueChart, PeakHoursChart, RankedBars } from '@/features/admin/reports/charts'
import { kigaliDate } from '@/features/store/hours'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import type { SalesReport } from '@/api/reports'

type Preset = 'today' | '7d' | '30d' | 'month' | 'custom'
const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'month', label: 'This month' },
  { key: 'custom', label: 'Custom' },
]

function rangeFor(preset: Preset): { from: string; to: string } {
  const to = kigaliDate()
  if (preset === 'today') return { from: to, to }
  if (preset === '7d') return { from: kigaliDate(-6), to }
  if (preset === '30d') return { from: kigaliDate(-29), to }
  return { from: `${to.slice(0, 8)}01`, to }
}

const dayLabel = (date: string) => formatDate(`${date}T12:00:00+02:00`, { day: 'numeric', month: 'short' })

export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>('7d')
  const [custom, setCustom] = useState(rangeFor('30d'))
  const range = preset === 'custom' ? custom : rangeFor(preset)
  const validRange = range.from <= range.to
  const report = useAsync(() => (validRange ? reportsApi.getSalesReport(range.from, range.to) : Promise.resolve(undefined)), [range.from, range.to])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">Reports</h1>
        {report.data && (
          <Button variant="outline" size="sm" className="ml-auto" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadCsv(report.data!)}>
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters live in one row above every chart they control. */}
      <div className="flex flex-wrap items-end gap-2">
        <div role="radiogroup" aria-label="Date range" className="scrollbar-none flex gap-1 overflow-x-auto rounded-full bg-surface p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={preset === p.key}
              onClick={() => setPreset(p.key)}
              className={cn('shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold', preset === p.key ? 'bg-brand text-brand-fg' : 'hover:bg-muted')}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-end gap-2">
            <Input label="From" type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
            <Input label="To" type="date" value={custom.to} min={custom.from} max={kigaliDate()} onChange={(e) => setCustom({ ...custom, to: e.target.value })} error={validRange ? undefined : 'Must be after From'} />
          </div>
        )}
      </div>

      {report.error && !report.data ? (
        <ErrorState error={report.error} onRetry={report.reload} />
      ) : !report.data ? (
        <ReportSkeleton />
      ) : (
        <ReportBody report={report.data} loading={report.loading} />
      )}
    </div>
  )
}

function ReportBody({ report, loading }: { report: SalesReport; loading: boolean }) {
  const { t } = useTranslation()
  const daily = useMemo(() => report.daily.map((d) => ({ ...d, label: dayLabel(d.date) })), [report])
  const hours = report.peakHours.filter((h) => h.hour >= 6 && h.hour <= 23)
  const busiest = [...report.peakHours].sort((a, b) => b.orders - a.orders)[0]
  const sold = report.itemSales.filter((i) => i.quantity > 0)
  const top = sold.slice(0, 5)
  const slow = [...report.itemSales].sort((a, b) => a.quantity - b.quantity).slice(0, 5)
  const paymentTotal = report.paymentBreakdown.reduce((s, p) => s + p.revenue, 0)
  const { cancellations: c } = report
  const singleDay = report.from === report.to

  return (
    <div className={cn('flex flex-col gap-4 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={formatMoney(report.revenue)} note="Completed orders, VAT included" />
        <Stat label="Orders" value={String(report.orderCount)} note={busiest?.orders ? `Busiest hour ${String(busiest.hour).padStart(2, '0')}:00` : undefined} />
        <Stat label="Average order" value={formatMoney(report.averageOrderValue)} />
        <Stat label="Cancelled or rejected" value={`${Math.round(c.rate * 100)}%`} note={`${c.cancelled} cancelled · ${c.rejected} rejected`} />
      </div>

      {report.orderCount === 0 ? (
        <Card>
          <EmptyState title="No completed orders in this period" description="Try a longer date range." />
        </Card>
      ) : (
        <>
          {!singleDay && (
            <Panel title="Revenue per day">
              <DailyRevenueChart data={daily} />
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold">Show as table</summary>
                <table className="mt-2 w-full">
                  <thead>
                    <tr className="text-left text-ink-soft">
                      <th className="py-1 font-semibold">Day</th>
                      <th className="py-1 text-right font-semibold">Orders</th>
                      <th className="py-1 text-right font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {daily.map((d) => (
                      <tr key={d.date}>
                        <td className="py-1">{d.label}</td>
                        <td className="py-1 text-right">{d.orders}</td>
                        <td className="py-1 text-right">{formatMoney(d.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </Panel>
          )}

          <Panel title="Orders by hour" description="Kigali time, 06:00–23:00">
            <PeakHoursChart data={hours} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Best sellers">
              <RankedBars rows={top.map((i) => ({ key: i.itemId, label: i.name, value: i.quantity, detail: `${i.quantity} sold · ${formatMoney(i.revenue)}` }))} max={top[0]?.quantity ?? 0} />
            </Panel>
            <Panel title="Slowest sellers" description="Candidates to promote or drop">
              <RankedBars rows={slow.map((i) => ({ key: i.itemId, label: i.name, value: i.quantity, detail: i.quantity === 0 ? 'none sold' : `${i.quantity} sold` }))} max={top[0]?.quantity ?? 0} />
            </Panel>
            <Panel title="Payment methods">
              <RankedBars
                rows={[...report.paymentBreakdown]
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((p) => ({ key: p.method, label: t(`payment.${p.method}`), value: p.revenue, detail: `${Math.round((p.revenue / paymentTotal) * 100)}% · ${p.orders} orders` }))}
                max={Math.max(...report.paymentBreakdown.map((p) => p.revenue))}
              />
            </Panel>
            <Panel title="Why orders were cancelled">
              {c.reasons.length === 0 ? (
                <p className="text-sm text-ink-soft">No cancelled or rejected orders.</p>
              ) : (
                <RankedBars rows={c.reasons.map((r) => ({ key: r.reason, label: r.reason, value: r.count, detail: String(r.count) }))} max={c.reasons[0].count} />
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
    </Card>
  )
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-bold">{title}</h2>
      {description && <p className="text-sm text-ink-soft">{description}</p>}
      <div className="mt-3">{children}</div>
    </Card>
  )
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

function downloadCsv(report: SalesReport) {
  const esc = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  const rows = [
    ['Crunch Crust sales report', `${report.from} to ${report.to}`],
    [],
    ['Date', 'Orders', 'Revenue (RWF)'],
    ...report.daily.map((d) => [d.date, d.orders, d.revenue]),
    [],
    ['Item', 'Quantity', 'Revenue (RWF)'],
    ...report.itemSales.map((i) => [i.name, i.quantity, i.revenue]),
  ]
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `crunch-crust-sales-${report.from}-to-${report.to}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
