import type { ID, Money, OrderRating, ProblemReport, User } from '@/types'
import { mock, notFound } from './client'
import { db } from './mock/db'

export interface CustomerSummary extends User {
  orderCount: number
  totalSpent: Money
  lastOrderAt?: string
}

/** GET /api/admin/customers */
export function listCustomers(): Promise<CustomerSummary[]> {
  return mock(() =>
    db.customers.map((c) => {
      const orders = db.orders.filter((o) => o.customerId === c.id && o.status === 'delivered')
      return {
        ...c,
        orderCount: orders.length,
        totalSpent: orders.reduce((s, o) => s + o.pricing.total, 0),
        lastOrderAt: orders.reduce<string | undefined>((latest, o) => (!latest || o.createdAt > latest ? o.createdAt : latest), undefined),
      }
    }),
  )
}

export interface FeedbackEntry {
  orderId: ID
  orderNumber: string
  customerName: string
  rating?: OrderRating
  problems: ProblemReport[]
  createdAt: string
}

/** GET /api/admin/feedback — ratings and problem reports, newest first. */
export function listFeedback(): Promise<FeedbackEntry[]> {
  return mock(() =>
    db.orders
      .filter((o) => o.rating || o.problemReports.length)
      .map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        rating: o.rating,
        problems: o.problemReports,
        createdAt: o.rating?.createdAt ?? o.problemReports[0]?.createdAt ?? o.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
}

/** PATCH /api/admin/orders/:orderId/problems/:problemId */
export function setProblemResolved(orderId: ID, problemId: ID, resolved: boolean): Promise<ProblemReport> {
  return mock(
    () => {
      const order = db.orders.find((o) => o.id === orderId) ?? notFound('Order')
      const problem = order.problemReports.find((p) => p.id === problemId) ?? notFound('Problem report')
      problem.resolved = resolved
      return problem
    },
    { write: true },
  )
}
