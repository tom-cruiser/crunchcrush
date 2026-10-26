import type { Address, CartItem, FulfillmentType, Order, OrderStatus, OrderStatusEvent, PaymentMethod, PaymentStatus } from '@/types'
import { calculatePricing } from '@/lib/pricing'
import { mockItems } from './menu'
import { mockCustomers } from './people'
import { mockSettings } from './settings'

/** Small deterministic PRNG so generated history is stable between reloads. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Builds a cart line from a menu item, picking the first available choice for each required option. */
export function buildLine(itemId: string, quantity = 1, addOnIds: string[] = [], note?: string): CartItem {
  const item = mockItems.find((i) => i.id === itemId)
  if (!item) throw new Error(`Unknown item ${itemId}`)
  const selectedOptions = item.options
    .filter((o) => o.required)
    .map((o) => {
      const choice = o.choices.find((c) => c.isAvailable) ?? o.choices[0]
      return { optionId: o.id, optionName: o.name, choiceIds: [choice.id], choiceNames: [choice.name], priceDelta: choice.priceDelta }
    })
  const selectedAddOns = item.addOns
    .filter((a) => addOnIds.includes(a.id))
    .map((a) => ({ addOnId: a.id, name: a.name, unitPrice: a.price, quantity: 1 }))
  const unitPrice =
    item.price + selectedOptions.reduce((s, o) => s + o.priceDelta, 0) + selectedAddOns.reduce((s, a) => s + a.unitPrice * a.quantity, 0)
  return {
    lineId: `${itemId}-${Math.random().toString(36).slice(2, 7)}`,
    itemId,
    name: item.name,
    imageUrl: item.imageUrl,
    basePrice: item.price,
    quantity,
    selectedOptions,
    selectedAddOns,
    removedIngredients: [],
    note,
    unitPrice,
  }
}

const FLOW: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered']

function historyFor(status: OrderStatus, fulfillment: FulfillmentType, createdAt: Date): OrderStatusEvent[] {
  const flow = fulfillment === 'delivery' ? FLOW : FLOW.filter((s) => s !== 'out_for_delivery')
  const at = (minutes: number) => new Date(createdAt.getTime() + minutes * 60_000).toISOString()
  if (status === 'rejected') return [{ status: 'received', at: at(0) }, { status: 'rejected', at: at(2) }]
  if (status === 'cancelled') return [{ status: 'received', at: at(0) }, { status: 'accepted', at: at(1) }, { status: 'cancelled', at: at(6) }]
  const end = flow.indexOf(status)
  const steps = [0, 2, 4, 18, 22, 40]
  return flow.slice(0, end + 1).map((s, i) => ({ status: s, at: at(steps[i]) }))
}

interface OrderSeed {
  id: string
  number: number
  minutesAgo: number
  status: OrderStatus
  fulfillment: FulfillmentType
  lines: CartItem[]
  customerIndex?: number
  guest?: { name: string; phone: string }
  paymentMethod: PaymentMethod
  paymentStatus?: PaymentStatus
  address?: Address
  riderId?: string
  promoCode?: string
  rejectionReason?: string
  cancellationReason?: string
  rating?: Order['rating']
  scheduledInMinutes?: number
}

function makeOrder(seed: OrderSeed, now: Date): Order {
  const createdAt = new Date(now.getTime() - seed.minutesAgo * 60_000)
  const customer = seed.customerIndex !== undefined ? mockCustomers[seed.customerIndex] : undefined
  const address = seed.fulfillment === 'delivery' ? (seed.address ?? customer?.addresses[0] ?? mockCustomers[0].addresses[0]) : undefined
  const pricing = calculatePricing({
    items: seed.lines,
    fulfillment: seed.fulfillment,
    deliveryFee: seed.fulfillment === 'delivery' ? 1000 : 0,
    settings: mockSettings,
  })
  const statusHistory = historyFor(seed.status, seed.fulfillment, createdAt)
  const paymentStatus: PaymentStatus =
    seed.paymentStatus ?? (seed.status === 'rejected' || seed.status === 'cancelled' ? (seed.paymentMethod === 'cash' ? 'failed' : 'refunded') : seed.paymentMethod === 'cash' && seed.status !== 'delivered' ? 'pending' : 'paid')
  return {
    id: seed.id,
    orderNumber: `CC-${seed.number}`,
    customerId: customer?.id,
    customerName: customer?.name ?? seed.guest?.name ?? 'Guest',
    customerPhone: customer?.phone ?? seed.guest?.phone ?? '+250788000000',
    items: seed.lines,
    fulfillment: seed.fulfillment,
    address,
    scheduledFor: seed.scheduledInMinutes ? new Date(now.getTime() + seed.scheduledInMinutes * 60_000).toISOString() : undefined,
    status: seed.status,
    statusHistory,
    paymentMethod: seed.paymentMethod,
    paymentStatus,
    pricing,
    promoCode: seed.promoCode,
    prepTimeMinutes: seed.status === 'received' ? undefined : 20,
    estimatedReadyAt: new Date(createdAt.getTime() + 25 * 60_000).toISOString(),
    riderId: seed.riderId,
    rejectionReason: seed.rejectionReason,
    cancellationReason: seed.cancellationReason,
    rating: seed.rating,
    problemReports: [],
    createdAt: createdAt.toISOString(),
    updatedAt: statusHistory[statusHistory.length - 1].at,
  }
}

/** One live order in every status, timestamped relative to now. */
function liveSeeds(): OrderSeed[] {
  return [
    { id: 'ord-1001', number: 1001, minutesAgo: 1, status: 'received', fulfillment: 'delivery', customerIndex: 1, paymentMethod: 'mtn_momo', lines: [buildLine('taco-beef', 1, ['ao-cheese'], 'Extra consommé please'), buildLine('drink-passion', 2)] },
    { id: 'ord-1002', number: 1002, minutesAgo: 3, status: 'received', fulfillment: 'pickup', guest: { name: 'Alice M.', phone: '+250788000004' }, paymentMethod: 'cash', lines: [buildLine('rolex-classic', 2), buildLine('drink-coffee', 2)] },
    { id: 'ord-1003', number: 1003, minutesAgo: 6, status: 'accepted', fulfillment: 'pickup', customerIndex: 2, paymentMethod: 'airtel_money', lines: [buildLine('combo-taco', 1), buildLine('dessert-churros', 1)] },
    { id: 'ord-1004', number: 1004, minutesAgo: 12, status: 'preparing', fulfillment: 'delivery', customerIndex: 0, paymentMethod: 'mtn_momo', promoCode: 'KARIBU10', lines: [buildLine('taco-chicken', 2, ['ao-guac']), buildLine('side-fries', 1), buildLine('drink-soda', 2)] },
    { id: 'ord-1005', number: 1005, minutesAgo: 20, status: 'ready', fulfillment: 'pickup', guest: { name: 'Yves K.', phone: '+250788777321' }, paymentMethod: 'card', lines: [buildLine('rolex-chicken', 1, ['ao-avocado']), buildLine('drink-water', 1)] },
    { id: 'ord-1006', number: 1006, minutesAgo: 28, status: 'out_for_delivery', fulfillment: 'delivery', customerIndex: 0, riderId: 'rider-1', paymentMethod: 'cash', lines: [buildLine('combo-family', 1)] },
    { id: 'ord-1007', number: 1007, minutesAgo: 75, status: 'delivered', fulfillment: 'delivery', customerIndex: 0, riderId: 'rider-2', paymentMethod: 'mtn_momo', lines: [buildLine('taco-mixed', 1), buildLine('drink-tree-tomato', 1)], rating: { food: 5, delivery: 4, comment: 'Birria was amazing, rider was quick.', createdAt: new Date().toISOString() } },
    { id: 'ord-1008', number: 1008, minutesAgo: 50, status: 'rejected', fulfillment: 'delivery', customerIndex: 3, paymentMethod: 'airtel_money', rejectionReason: 'Address outside delivery zone', lines: [buildLine('rolex-cheese', 3)] },
    { id: 'ord-1009', number: 1009, minutesAgo: 95, status: 'cancelled', fulfillment: 'pickup', customerIndex: 1, paymentMethod: 'mtn_momo', cancellationReason: 'Customer changed their mind', lines: [buildLine('taco-goat', 1)] },
    { id: 'ord-1010', number: 1010, minutesAgo: 0, status: 'received', fulfillment: 'delivery', customerIndex: 0, paymentMethod: 'mtn_momo', scheduledInMinutes: 180, lines: [buildLine('combo-rolex', 2)] },
  ]
}

/** About 30 days of completed orders for reports and order history. */
function historySeeds(now: Date): OrderSeed[] {
  const rand = seeded(42)
  const available = mockItems.filter((i) => i.isAvailable)
  const methods: PaymentMethod[] = ['mtn_momo', 'mtn_momo', 'mtn_momo', 'airtel_money', 'airtel_money', 'card', 'cash']
  const fulfillments: FulfillmentType[] = ['delivery', 'delivery', 'pickup']
  // Weighted toward lunch (12-14h) and dinner (18-21h).
  const hours = [7, 8, 11, 12, 12, 13, 13, 14, 17, 18, 19, 19, 20, 20, 21]
  const seeds: OrderSeed[] = []
  for (let i = 0; i < 160; i++) {
    const daysAgo = 1 + Math.floor(rand() * 30)
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(hours[Math.floor(rand() * hours.length)], Math.floor(rand() * 60), 0, 0)
    const lineCount = 1 + Math.floor(rand() * 3)
    // Popular items are picked more often so best/worst seller reports look realistic.
    const lines = Array.from({ length: lineCount }, () => {
      const pool = rand() < 0.5 ? available.filter((m) => m.isPopular) : available
      return buildLine(pool[Math.floor(rand() * pool.length)].id, 1 + Math.floor(rand() * 2))
    })
    const roll = rand()
    const status: OrderStatus = roll < 0.05 ? 'cancelled' : roll < 0.08 ? 'rejected' : 'delivered'
    const fulfillment = fulfillments[Math.floor(rand() * fulfillments.length)]
    const customerIndex = rand() < 0.7 ? Math.floor(rand() * mockCustomers.length) : undefined
    seeds.push({
      id: `ord-h${i}`,
      number: 900 - i,
      minutesAgo: Math.round((now.getTime() - date.getTime()) / 60_000),
      status,
      fulfillment,
      lines,
      customerIndex,
      guest: customerIndex === undefined ? { name: 'Guest', phone: '+250788000000' } : undefined,
      paymentMethod: methods[Math.floor(rand() * methods.length)],
      riderId: fulfillment === 'delivery' && status === 'delivered' ? (rand() < 0.5 ? 'rider-1' : 'rider-2') : undefined,
      cancellationReason: status === 'cancelled' ? 'Customer cancelled' : undefined,
      rejectionReason: status === 'rejected' ? 'Kitchen too busy' : undefined,
      rating: status === 'delivered' && rand() < 0.35 ? { food: 3 + Math.floor(rand() * 3), delivery: fulfillment === 'delivery' ? 3 + Math.floor(rand() * 3) : undefined, createdAt: date.toISOString() } : undefined,
    })
  }
  return seeds
}

export function createMockOrders(now = new Date()): Order[] {
  return [...liveSeeds(), ...historySeeds(now)].map((s) => makeOrder(s, now)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
