import type { ID, PaymentMethod, PaymentStatus } from '@/types'
import { mock, notFound } from './client'
import { db } from './mock/db'

export interface PaymentSession {
  id: ID
  orderId: ID
  method: PaymentMethod
  status: PaymentStatus
  /** Shown to the customer while waiting, e.g. "Approve the prompt on your phone". */
  instructions: string
  failureReason?: string
}

interface PaymentRecord extends PaymentSession {
  startedAt: number
  willFail: boolean
}

const payments = new Map<ID, PaymentRecord>()
const CONFIRM_AFTER_MS = 5000

export interface PaymentInput {
  method: PaymentMethod
  /** Mobile money number. Numbers ending in 0000 simulate a declined payment. */
  phone?: string
  /** Card last four digits. 0002 simulates a declined card. */
  cardLast4?: string
}

/** POST /api/orders/:id/payments — starts a payment; mobile money sends a USSD push. */
export function initiatePayment(orderId: ID, input: PaymentInput): Promise<PaymentSession> {
  return mock(
    () => {
      const order = db.orders.find((o) => o.id === orderId) ?? notFound('Order')
      const instructions =
        input.method === 'mtn_momo'
          ? `Approve the MTN MoMo prompt sent to ${input.phone}. Dial *182*7*1# if it doesn’t appear.`
          : input.method === 'airtel_money'
            ? `Approve the Airtel Money prompt sent to ${input.phone}. Dial *182*7*1# if it doesn’t appear.`
            : input.method === 'card'
              ? 'Confirming your card with the bank…'
              : 'Pay with cash when you receive your order.'
      const record: PaymentRecord = {
        id: `pay-${order.id}-${Date.now()}`,
        orderId,
        method: input.method,
        status: 'pending',
        instructions,
        startedAt: Date.now(),
        willFail: Boolean(input.phone?.replace(/\D/g, '').endsWith('0000') || input.cardLast4 === '0002'),
      }
      order.paymentMethod = input.method
      order.paymentStatus = 'pending'
      // Cash needs no confirmation: the order goes straight to the kitchen.
      if (input.method === 'cash' && !order.scheduledFor && order.status === 'received') db.simulatedOrders[order.id] = Date.now()
      payments.set(record.id, record)
      return toSession(record)
    },
    { write: true, minDelay: 500, maxDelay: 900 },
  )
}

function toSession({ startedAt: _s, willFail: _w, ...session }: PaymentRecord): PaymentSession {
  return session
}

/** GET /api/payments/:id — poll until the status leaves "pending". */
export function getPaymentStatus(paymentId: ID): Promise<PaymentSession> {
  return mock(
    () => {
      const record = payments.get(paymentId) ?? notFound('Payment')
      if (record.method !== 'cash' && record.status === 'pending' && Date.now() - record.startedAt > CONFIRM_AFTER_MS) {
        const order = db.orders.find((o) => o.id === record.orderId)
        if (record.willFail) {
          record.status = 'failed'
          record.failureReason = record.method === 'card' ? 'Your card was declined.' : 'The payment was declined or timed out.'
        } else {
          record.status = 'paid'
          if (order && !order.scheduledFor && order.status === 'received') db.simulatedOrders[order.id] = Date.now()
        }
        if (order) order.paymentStatus = record.status
      }
      return toSession(record)
    },
    { minDelay: 200, maxDelay: 400 },
  )
}
