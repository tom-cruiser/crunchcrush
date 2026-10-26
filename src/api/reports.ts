import type { ID, Money, PaymentMethod } from '@/types'
import { mock } from './client'
import { db } from './mock/db'

/** Kigali is UTC+2 all year (no DST), so shifting the timestamp gives local date and hour. */
const KIGALI_OFFSET_MS = 2 * 3_600_000
const kigaliParts = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + KIGALI_OFFSET_MS)
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() }
}

export interface SalesReport {
  from: string
  to: string
  orderCount: number
  revenue: Money
  averageOrderValue: Money
  daily: { date: string; revenue: Money; orders: number }[]
  itemSales: { itemId: ID; name: string; quantity: number; revenue: Money }[]
  peakHours: { hour: number; orders: number }[]
  paymentBreakdown: { method: PaymentMethod; orders: number; revenue: Money }[]
  cancellations: { cancelled: number; rejected: number; rate: number; reasons: { reason: string; count: number }[] }
}

/** GET /api/admin/reports/sales?from&to — `from`/`to` are ISO dates (inclusive). */
export function getSalesReport(from: string, to: string): Promise<SalesReport> {
  return mock(
    () => {
      const inRange = db.orders.filter((o) => {
        const { date } = kigaliParts(o.createdAt)
        return date >= from && date <= to
      })
      const completed = inRange.filter((o) => o.status === 'delivered')
      const revenue = completed.reduce((s, o) => s + o.pricing.total, 0)

      const daily = new Map<string, { revenue: number; orders: number }>()
      for (let d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
        daily.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 })
      }
      const items = new Map<ID, { name: string; quantity: number; revenue: number }>()
      const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }))
      const payments = new Map<PaymentMethod, { orders: number; revenue: number }>()

      for (const o of completed) {
        const local = kigaliParts(o.createdAt)
        const day = daily.get(local.date)
        if (day) {
          day.revenue += o.pricing.total
          day.orders += 1
        }
        hours[local.hour].orders += 1
        const p = payments.get(o.paymentMethod) ?? { orders: 0, revenue: 0 }
        p.orders += 1
        p.revenue += o.pricing.total
        payments.set(o.paymentMethod, p)
        for (const line of o.items) {
          const entry = items.get(line.itemId) ?? { name: line.name, quantity: 0, revenue: 0 }
          entry.quantity += line.quantity
          entry.revenue += line.unitPrice * line.quantity
          items.set(line.itemId, entry)
        }
      }
      // Items that never sold still belong in the worst-seller list.
      for (const item of db.items) if (!items.has(item.id)) items.set(item.id, { name: item.name, quantity: 0, revenue: 0 })

      const cancelled = inRange.filter((o) => o.status === 'cancelled')
      const rejected = inRange.filter((o) => o.status === 'rejected')
      const reasons = new Map<string, number>()
      for (const o of [...cancelled, ...rejected]) {
        const reason = o.cancellationReason ?? o.rejectionReason ?? 'No reason given'
        reasons.set(reason, (reasons.get(reason) ?? 0) + 1)
      }

      return {
        from,
        to,
        orderCount: completed.length,
        revenue,
        averageOrderValue: completed.length ? Math.round(revenue / completed.length) : 0,
        daily: [...daily].map(([date, v]) => ({ date, ...v })),
        itemSales: [...items].map(([itemId, v]) => ({ itemId, ...v })).sort((a, b) => b.quantity - a.quantity),
        peakHours: hours,
        paymentBreakdown: [...payments].map(([method, v]) => ({ method, ...v })),
        cancellations: {
          cancelled: cancelled.length,
          rejected: rejected.length,
          rate: inRange.length ? (cancelled.length + rejected.length) / inRange.length : 0,
          reasons: [...reasons].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
        },
      }
    },
    { minDelay: 400, maxDelay: 900 },
  )
}
