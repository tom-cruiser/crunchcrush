import type { ID, Money, PaymentMethod } from '@/types'
import { http } from './http'

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

/** GET /api/admin/reports/sales?from&to — `from`/`to` are Kigali dates, inclusive. */
export function getSalesReport(from: string, to: string): Promise<SalesReport> {
  return http('/admin/reports/sales', { query: { from, to } })
}
