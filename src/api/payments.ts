import type { ID, PaymentMethod, PaymentStatus } from '@/types'
import { http } from './http'

export interface PaymentSession {
  id: ID
  orderId: ID
  method: PaymentMethod
  status: PaymentStatus
  /** Shown to the customer while waiting, e.g. "Approve the prompt on your phone". */
  instructions: string
  failureReason?: string
}

export interface PaymentInput {
  method: PaymentMethod
  /** Mobile money number. */
  phone?: string
  /** Card last four digits. */
  cardLast4?: string
}

/** Which order each payment belongs to, so polling can send that order's access token. */
const paymentOrders = new Map<ID, ID>()

/** POST /api/orders/:id/payments — starts a payment; mobile money sends a USSD push. */
export async function initiatePayment(orderId: ID, input: PaymentInput): Promise<PaymentSession> {
  const session = await http<PaymentSession>(`/orders/${encodeURIComponent(orderId)}/payments`, { method: 'POST', body: input, orderId })
  paymentOrders.set(session.id, orderId)
  return session
}

/** GET /api/payments/:id — poll until the status leaves "pending". */
export function getPaymentStatus(paymentId: ID): Promise<PaymentSession> {
  return http(`/payments/${encodeURIComponent(paymentId)}`, { orderId: paymentOrders.get(paymentId) })
}
