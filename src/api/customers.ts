import type { ID, Money, Order, OrderRating, ProblemReport, User } from '@/types'
import { http } from './http'

export interface CustomerSummary extends User {
  orderCount: number
  totalSpent: Money
  lastOrderAt?: string
}

/** GET /api/admin/customers */
export function listCustomers(): Promise<CustomerSummary[]> {
  return http('/admin/customers')
}

/** GET /api/admin/customers/:id/orders — a customer's orders, newest first. */
export function listCustomerOrders(customerId: ID): Promise<Order[]> {
  return http(`/admin/customers/${encodeURIComponent(customerId)}/orders`)
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
  return http('/admin/feedback')
}

/** PATCH /api/admin/orders/:orderId/problems/:problemId */
export function setProblemResolved(orderId: ID, problemId: ID, resolved: boolean): Promise<ProblemReport> {
  return http(`/admin/orders/${encodeURIComponent(orderId)}/problems/${encodeURIComponent(problemId)}`, { method: 'PATCH', body: { resolved } })
}
