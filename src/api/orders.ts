import type { Address, CartItem, Coordinates, FulfillmentType, ID, Order, OrderRating, OrderStatus, PaymentMethod, ProblemReport, Rider } from '@/types'
import { distanceKm } from '@/lib/geo'
import { uid } from '@/lib/id'
import { calculatePricing, cartSubtotal } from '@/lib/pricing'
import { ApiError, mock, notFound } from './client'
import { db } from './mock/db'

export const ORDER_FLOW: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered']
export const ACTIVE_STATUSES: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery']

export function flowFor(fulfillment: FulfillmentType): OrderStatus[] {
  return fulfillment === 'delivery' ? ORDER_FLOW : ORDER_FLOW.filter((s) => s !== 'out_for_delivery')
}

// ---- Status simulation for orders placed from the customer app ----

/** Seconds after placement at which a simulated order reaches each status. */
const SIMULATED_TIMELINE: Partial<Record<OrderStatus, number>> = {
  accepted: 10,
  preparing: 25,
  ready: 60,
  out_for_delivery: 75,
  delivered: 120,
}

function setStatus(order: Order, status: OrderStatus, note?: string, at = new Date()) {
  order.status = status
  order.updatedAt = at.toISOString()
  order.statusHistory.push({ status, at: order.updatedAt, note })
}

function tickSimulation() {
  if (db.simulationEnabled === false) return
  const now = Date.now()
  for (const [orderId, startedAt] of Object.entries(db.simulatedOrders)) {
    const order = db.orders.find((o) => o.id === orderId)
    if (!order || !ACTIVE_STATUSES.includes(order.status)) {
      delete db.simulatedOrders[orderId]
      continue
    }
    for (const status of flowFor(order.fulfillment)) {
      const offset = SIMULATED_TIMELINE[status]
      if (offset === undefined || order.statusHistory.some((h) => h.status === status)) continue
      if (now - startedAt < offset * 1000) break
      setStatus(order, status, undefined, new Date(startedAt + offset * 1000))
      if (status === 'accepted') order.prepTimeMinutes = db.settings.defaultPrepTimeMinutes
      if (status === 'out_for_delivery') {
        const rider = db.riders.find((r) => r.status === 'available') ?? db.riders[0]
        if (rider) {
          order.riderId = rider.id
          rider.activeOrderIds.push(order.id)
          rider.status = 'on_delivery'
        }
      }
      if (status === 'delivered') {
        if (order.paymentMethod === 'cash') order.paymentStatus = 'paid'
        const rider = db.riders.find((r) => r.id === order.riderId)
        if (rider) {
          rider.activeOrderIds = rider.activeOrderIds.filter((id) => id !== order.id)
          if (rider.activeOrderIds.length === 0 && rider.status === 'on_delivery') rider.status = 'available'
        }
      }
    }
  }
}

/** Demo orders: move the rider along a straight line from the restaurant to the customer. */
function simulatedLocation(order: Order): Coordinates | undefined {
  const startedAt = db.simulatedOrders[order.id]
  const to = order.address?.coordinates
  if (startedAt === undefined || !to || order.status !== 'out_for_delivery') return undefined
  const from = db.settings.address.coordinates
  const leave = SIMULATED_TIMELINE.out_for_delivery! * 1000
  const arrive = SIMULATED_TIMELINE.delivered! * 1000
  const progress = Math.min(1, Math.max(0, (Date.now() - startedAt - leave) / (arrive - leave)))
  return { lat: from.lat + (to.lat - from.lat) * progress, lng: from.lng + (to.lng - from.lng) * progress }
}

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

/** POST /api/orders — the server recalculates prices and checks every rule again. */
export function placeOrder(input: PlaceOrderInput): Promise<Order> {
  return mock(
    () => {
      const { settings } = db
      if (!settings.isOpen && !input.scheduledFor) throw new ApiError('closed', 'The restaurant is closed right now. Schedule your order for later.')
      if (input.items.length === 0) throw new ApiError('empty_cart', 'Your cart is empty.')
      for (const line of input.items) {
        const item = db.items.find((i) => i.id === line.itemId)
        if (!item || !item.isAvailable) throw new ApiError('sold_out', `${line.name} is sold out. Remove it to continue.`)
      }
      let deliveryFee = 0
      if (input.fulfillment === 'delivery') {
        if (!input.address) throw new ApiError('address_required', 'Add a delivery address.')
        const distance = distanceKm(settings.address.coordinates, input.address.coordinates)
        const zone = db.zones.filter((z) => z.isActive && distance <= z.radiusKm).sort((a, b) => a.radiusKm - b.radiusKm)[0]
        if (!zone) throw new ApiError('out_of_zone', 'Sorry, we don’t deliver to this address yet.')
        deliveryFee = zone.fee
        if (cartSubtotal(input.items) < zone.minOrder) throw new ApiError('min_order', `Minimum order for ${zone.name} is ${zone.minOrder} RWF.`)
      }
      const promo = input.promoCode ? db.promos.find((p) => p.code === input.promoCode?.toUpperCase() && p.isActive) : undefined
      const pricing = calculatePricing({ items: input.items, fulfillment: input.fulfillment, deliveryFee, settings, promo })
      if (pricing.subtotal < settings.minimumOrder) throw new ApiError('min_order', `Minimum order is ${settings.minimumOrder} RWF.`)
      if (promo) promo.usedCount += 1

      const now = new Date()
      const order: Order = {
        id: uid('ord'),
        orderNumber: `CC-${db.nextOrderNumber++}`,
        customerId: input.customer.id,
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        items: input.items,
        fulfillment: input.fulfillment,
        address: input.address,
        scheduledFor: input.scheduledFor,
        status: 'received',
        statusHistory: [{ status: 'received', at: now.toISOString() }],
        paymentMethod: input.paymentMethod,
        paymentStatus: 'pending',
        pricing,
        promoCode: promo?.code,
        estimatedReadyAt: new Date(now.getTime() + (settings.defaultPrepTimeMinutes + (settings.busyMode ? settings.busyExtraMinutes : 0)) * 60_000).toISOString(),
        problemReports: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
      db.orders.unshift(order)
      // Cash orders go to the kitchen straight away; prepaid ones once payment succeeds.
      if (!input.scheduledFor && input.paymentMethod === 'cash') db.simulatedOrders[order.id] = now.getTime()
      return order
    },
    { write: true, minDelay: 600, maxDelay: 1200 },
  )
}

/** GET /api/orders/:id */
export function getOrder(id: ID): Promise<Order> {
  return mock(() => {
    tickSimulation()
    return db.orders.find((o) => o.id === id || o.orderNumber === id) ?? notFound('Order')
  })
}

/**
 * GET /api/me/orders — the customer's orders, including guest orders placed with the
 * same phone number before they signed in (these get linked to the account).
 */
export function listCustomerOrders(customerId: ID): Promise<Order[]> {
  return mock(() => {
    tickSimulation()
    const phone = db.customers.find((c) => c.id === customerId)?.phone
    for (const o of db.orders) if (!o.customerId && phone && o.customerPhone === phone) o.customerId = customerId
    return db.orders.filter((o) => o.customerId === customerId)
  })
}

/** GET /api/orders?ids= — orders this device placed as a guest. */
export function listOrdersByIds(ids: ID[]): Promise<Order[]> {
  return mock(() => {
    tickSimulation()
    return db.orders.filter((o) => ids.includes(o.id))
  })
}

/** GET /api/orders/:id/rider — public rider details for the customer while out for delivery. */
export function getOrderRider(orderId: ID): Promise<Pick<Rider, 'id' | 'name' | 'phone' | 'vehicle' | 'plateNumber' | 'currentLocation'> | null> {
  return mock(() => {
    const order = db.orders.find((o) => o.id === orderId) ?? notFound('Order')
    const rider = db.riders.find((r) => r.id === order.riderId)
    if (!rider) return null
    const { id, name, phone, vehicle, plateNumber } = rider
    return { id, name, phone, vehicle, plateNumber, currentLocation: simulatedLocation(order) ?? rider.currentLocation }
  })
}

/** POST /api/orders/:id/cancel — customers may cancel only before the kitchen accepts. */
export function cancelOrder(id: ID, reason: string): Promise<Order> {
  return mock(
    () => {
      const order = db.orders.find((o) => o.id === id) ?? notFound('Order')
      if (order.status !== 'received') throw new ApiError('too_late', 'This order is already being prepared and can’t be cancelled.')
      order.cancellationReason = reason
      if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded'
      setStatus(order, 'cancelled', reason)
      return order
    },
    { write: true },
  )
}

/** POST /api/orders/:id/rating */
export function rateOrder(id: ID, rating: Omit<OrderRating, 'createdAt'>): Promise<Order> {
  return mock(
    () => {
      const order = db.orders.find((o) => o.id === id) ?? notFound('Order')
      order.rating = { ...rating, createdAt: new Date().toISOString() }
      return order
    },
    { write: true },
  )
}

/** POST /api/orders/:id/problems */
export function reportProblem(id: ID, input: Pick<ProblemReport, 'type' | 'message'>): Promise<Order> {
  return mock(
    () => {
      const order = db.orders.find((o) => o.id === id) ?? notFound('Order')
      order.problemReports.push({ ...input, id: uid('prob'), createdAt: new Date().toISOString(), resolved: false })
      return order
    },
    { write: true },
  )
}

// ---- Admin / staff ----

/** Demo only: whether customer orders advance on their own (no real kitchen in the mock). */
export function getSimulationEnabled(): Promise<boolean> {
  return mock(() => db.simulationEnabled !== false, { minDelay: 50, maxDelay: 100 })
}

export function setSimulationEnabled(enabled: boolean): Promise<boolean> {
  return mock(
    () => {
      db.simulationEnabled = enabled
      // Restart the clock so orders don't jump several steps when switched back on.
      if (enabled) for (const id of Object.keys(db.simulatedOrders)) db.simulatedOrders[id] = Date.now()
      return enabled
    },
    { write: true, minDelay: 50, maxDelay: 100 },
  )
}

export interface OrderFilter {
  statuses?: OrderStatus[]
  fulfillment?: FulfillmentType
  search?: string
  since?: string
}

/** GET /api/admin/orders */
export function listOrders(filter: OrderFilter = {}): Promise<Order[]> {
  return mock(
    () => {
      tickSimulation()
      const q = filter.search?.trim().toLowerCase()
      return db.orders.filter(
        (o) =>
          (!filter.statuses || filter.statuses.includes(o.status)) &&
          (!filter.fulfillment || o.fulfillment === filter.fulfillment) &&
          (!filter.since || o.createdAt >= filter.since) &&
          (!q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q)),
      )
    },
    { minDelay: 150, maxDelay: 400 },
  )
}

function staffUpdate(id: ID, fn: (order: Order) => void) {
  return mock(
    () => {
      const order = db.orders.find((o) => o.id === id) ?? notFound('Order')
      // A person has taken over: stop the automatic simulation for this order.
      delete db.simulatedOrders[id]
      fn(order)
      return order
    },
    { write: true, minDelay: 150, maxDelay: 350 },
  )
}

/** POST /api/admin/orders/:id/accept */
export function acceptOrder(id: ID, prepTimeMinutes: number): Promise<Order> {
  return staffUpdate(id, (order) => {
    order.prepTimeMinutes = prepTimeMinutes
    order.estimatedReadyAt = new Date(Date.now() + prepTimeMinutes * 60_000).toISOString()
    setStatus(order, 'accepted')
  })
}

/** POST /api/admin/orders/:id/reject */
export function rejectOrder(id: ID, reason: string): Promise<Order> {
  return staffUpdate(id, (order) => {
    order.rejectionReason = reason
    if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded'
    setStatus(order, 'rejected', reason)
  })
}

/** PATCH /api/admin/orders/:id/status */
export function updateOrderStatus(id: ID, status: OrderStatus, note?: string): Promise<Order> {
  return staffUpdate(id, (order) => {
    setStatus(order, status, note)
    if (status === 'delivered' && order.paymentMethod === 'cash') order.paymentStatus = 'paid'
    if (status === 'cancelled') order.cancellationReason = note
    if (status === 'delivered' || status === 'cancelled') {
      const rider = db.riders.find((r) => r.id === order.riderId)
      if (rider) {
        rider.activeOrderIds = rider.activeOrderIds.filter((o) => o !== id)
        if (rider.activeOrderIds.length === 0 && rider.status === 'on_delivery') rider.status = 'available'
      }
    }
  })
}

/** POST /api/admin/orders/:id/rider — reassigning removes the order from the previous rider. */
export function assignRider(id: ID, riderId: ID): Promise<Order> {
  return staffUpdate(id, (order) => {
    for (const r of db.riders) r.activeOrderIds = r.activeOrderIds.filter((o) => o !== id)
    order.riderId = riderId
    const rider = db.riders.find((r) => r.id === riderId)
    if (rider) {
      rider.activeOrderIds.push(id)
      rider.status = 'on_delivery'
    }
  })
}

/** PATCH /api/admin/orders/:id/prep-time — push the estimate back while preparing. */
export function updatePrepTime(id: ID, prepTimeMinutes: number): Promise<Order> {
  return staffUpdate(id, (order) => {
    order.prepTimeMinutes = prepTimeMinutes
    const accepted = order.statusHistory.find((h) => h.status === 'accepted')?.at ?? new Date().toISOString()
    order.estimatedReadyAt = new Date(new Date(accepted).getTime() + prepTimeMinutes * 60_000).toISOString()
  })
}
