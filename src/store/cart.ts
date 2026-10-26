import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, FulfillmentType, ID, PromoCode } from '@/types'
import { uid } from '@/lib/id'

interface CartState {
  items: CartItem[]
  fulfillment: FulfillmentType
  /** Set when the customer arrived via /table/:n. */
  tableNumber?: number
  /** Promo validated by the API; checkout re-validates before placing the order. */
  promo?: PromoCode
  addItem: (item: Omit<CartItem, 'lineId'>) => void
  updateItem: (lineId: ID, patch: Partial<Omit<CartItem, 'lineId'>>) => void
  setQuantity: (lineId: ID, quantity: number) => void
  removeItem: (lineId: ID) => void
  clear: () => void
  setFulfillment: (fulfillment: FulfillmentType) => void
  setTable: (tableNumber?: number) => void
  setPromo: (promo?: PromoCode) => void
}

/** Two lines merge only when every customization matches. */
const sameConfig = (a: Omit<CartItem, 'lineId'>, b: CartItem) =>
  a.itemId === b.itemId &&
  JSON.stringify([a.selectedOptions, a.selectedAddOns, [...a.removedIngredients].sort(), a.note ?? '']) ===
    JSON.stringify([b.selectedOptions, b.selectedAddOns, [...b.removedIngredients].sort(), b.note ?? ''])

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      fulfillment: 'delivery',
      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => sameConfig(item, i))
          if (existing) {
            return { items: s.items.map((i) => (i === existing ? { ...i, quantity: i.quantity + item.quantity } : i)) }
          }
          return { items: [...s.items, { ...item, lineId: uid('line') }] }
        }),
      updateItem: (lineId, patch) => set((s) => ({ items: s.items.map((i) => (i.lineId === lineId ? { ...i, ...patch } : i)) })),
      setQuantity: (lineId, quantity) =>
        set((s) => ({
          items: quantity <= 0 ? s.items.filter((i) => i.lineId !== lineId) : s.items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
        })),
      removeItem: (lineId) => set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),
      clear: () => set({ items: [], promo: undefined }),
      setFulfillment: (fulfillment) => set({ fulfillment }),
      setTable: (tableNumber) => set(tableNumber ? { tableNumber, fulfillment: 'dine-in' } : { tableNumber: undefined }),
      setPromo: (promo) => set({ promo }),
    }),
    { name: 'cc-cart', version: 2, migrate: (state) => ({ ...(state as CartState), promo: undefined }) },
  ),
)

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0)
