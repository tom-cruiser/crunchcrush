import type { Address, CartItem, FulfillmentType, ID, Order, OrderRating, OrderStatus, PaymentMethod, ProblemReport, Rider } from '@/types'
import { usePreferences } from '@/store/preferences'
import { http } from './http'

export const ORDER_FLOW: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered']
export const ACTIVE_STATUSES: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery']

export function flowFor(fulfillment: FulfillmentType): OrderStatus[] {
  return fulfillment === 'delivery' ? ORDER_FLOW : ORDER_FLOW.filter((s) => s !== 'out_for_delivery')
}

const orderPath = (id: ID, rest = '') => `/orders/${encodeURIComponent(id)}${rest}`

// ---- Customer ----

export interface PlaceOrderInput {
  items: CartItem[]
  fulfillment: FulfillmentType
  address?: Address
  scheduledFor?: string
  paymentMethod: PaymentMethod
  promoCode?: string
  customer: { id?: ID; name: string; phone: string }
}

/**
 * POST /api/orders — the server recalculates prices and checks every rule again. The
 * returned access token is kept on this device and sent back with later calls for the order.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const { accessToken, ...order } = await http<Order & { accessToken?: string }>('/orders', { method: 'POST', body: input })
  if (accessToken) usePreferences.getState().rememberOrderToken(order.id, accessToken)
  return order
}

/** GET /api/orders/:idOrNumber */
export function getOrder(id: ID): Promise<Order> {
  return http(orderPath(id), { orderId: id })
}

/**
 * GET /api/me/orders — the customer's orders, including guest orders placed with the
 * same phone number before they signed in (these get linked to the account).
 */
export function listCustomerOrders(_customerId: ID): Promise<Order[]> {
  return http('/me/orders')
}

/** GET /api/orders?ids= — orders this device placed as a guest. */
export function listOrdersByIds(ids: ID[]): Promise<Order[]> {
  if (!ids.length) return Promise.resolve([])
  return http('/orders', { query: { ids: ids.join(',') } })
}

/** GET /api/orders/:id/rider — public rider details for the customer while out for delivery. */
export function getOrderRider(orderId: ID): Promise<Pick<Rider, 'id' | 'name' | 'phone' | 'vehicle' | 'plateNumber' | 'currentLocation'> | null> {
  return http(orderPath(orderId, '/rider'), { orderId })
}

/** POST /api/orders/:id/cancel — customers may cancel only before the kitchen accepts. */
export function cancelOrder(id: ID, reason: string): Promise<Order> {
  return http(orderPath(id, '/cancel'), { method: 'POST', body: { reason }, orderId: id })
}

/** POST /api/orders/:id/rating */
export function rateOrder(id: ID, rating: Omit<OrderRating, 'createdAt'>): Promise<Order> {
  return http(orderPath(id, '/rating'), { method: 'POST', body: rating, orderId: id })
}

/** POST /api/orders/:id/problems */
export function reportProblem(id: ID, input: Pick<ProblemReport, 'type' | 'message'>): Promise<Order> {
  return http(orderPath(id, '/problems'), { method: 'POST', body: input, orderId: id })
}

// ---- Admin / staff ----

export interface OrderFilter {
  statuses?: OrderStatus[]
  fulfillment?: FulfillmentType
  search?: string
  since?: string
}

/** GET /api/admin/orders */
export function listOrders(filter: OrderFilter = {}): Promise<Order[]> {
  return http('/admin/orders', { query: { statuses: filter.statuses?.join(','), fulfillment: filter.fulfillment, search: filter.search?.trim(), since: filter.since } })
}

const adminPath = (id: ID, rest: string) => `/admin/orders/${encodeURIComponent(id)}${rest}`

/** POST /api/admin/orders/:id/accept */
export function acceptOrder(id: ID, prepTimeMinutes: number): Promise<Order> {
  return http(adminPath(id, '/accept'), { method: 'POST', body: { prepTimeMinutes } })
}

/** POST /api/admin/orders/:id/reject */
export function rejectOrder(id: ID, reason: string): Promise<Order> {
  return http(adminPath(id, '/reject'), { method: 'POST', body: { reason } })
}

/** PATCH /api/admin/orders/:id/status */
export function updateOrderStatus(id: ID, status: OrderStatus, note?: string): Promise<Order> {
  return http(adminPath(id, '/status'), { method: 'PATCH', body: { status, note } })
}

/** POST /api/admin/orders/:id/rider — reassigning removes the order from the previous rider. */
export function assignRider(id: ID, riderId: ID): Promise<Order> {
  return http(adminPath(id, '/rider'), { method: 'POST', body: { riderId } })
}

/** PATCH /api/admin/orders/:id/prep-time — push the estimate back while preparing. */
export function updatePrepTime(id: ID, prepTimeMinutes: number): Promise<Order> {
  return http(adminPath(id, '/prep-time'), { method: 'PATCH', body: { prepTimeMinutes } })
}
