import type { ComboDeal, DeliveryZone, MenuCategory, MenuItem, Order, PromoCode, RestaurantSettings, Rider, Staff, User } from '@/types'
import { mockCategories, mockItems } from './menu'
import { createMockOrders } from './orders'
import { mockCustomers, mockRiders, mockStaff } from './people'
import { mockCombos, mockPromos } from './promos'
import { mockSettings, mockZones } from './settings'

export interface MockDb {
  version: number
  categories: MenuCategory[]
  items: MenuItem[]
  orders: Order[]
  settings: RestaurantSettings
  zones: DeliveryZone[]
  promos: PromoCode[]
  combos: ComboDeal[]
  staff: Staff[]
  riders: Rider[]
  customers: User[]
  /** Order ids whose status the mock advances automatically, keyed to the time simulation started. */
  simulatedOrders: Record<string, number>
  /** Demo switch: when false, customer orders wait for staff instead of advancing on their own. */
  simulationEnabled?: boolean
  nextOrderNumber: number
}

const STORAGE_KEY = 'cc-mockdb'
const VERSION = 1

function seed(): MockDb {
  return {
    version: VERSION,
    categories: structuredClone(mockCategories),
    items: structuredClone(mockItems),
    orders: createMockOrders(),
    settings: structuredClone(mockSettings),
    zones: structuredClone(mockZones),
    promos: structuredClone(mockPromos),
    combos: structuredClone(mockCombos),
    staff: structuredClone(mockStaff),
    riders: structuredClone(mockRiders),
    customers: structuredClone(mockCustomers),
    simulatedOrders: {},
    nextOrderNumber: 1011,
  }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb
      if (parsed.version === VERSION) return parsed
    }
  } catch {
    // Storage unavailable or corrupt: fall back to fresh seed data.
  }
  return seed()
}

/**
 * In-memory "database" persisted to localStorage so admin edits and placed orders
 * survive reloads and are shared between the customer and admin views in one browser.
 */
export const db: MockDb = load()

export function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode: data stays in memory for this session.
  }
}

export function resetDb(): void {
  Object.assign(db, seed())
  persist()
}

// Keep tabs in sync: an order placed in one tab shows up in the admin tab.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        Object.assign(db, JSON.parse(e.newValue))
      } catch {
        // Ignore malformed writes from other tabs.
      }
    }
  })
}

persist()
