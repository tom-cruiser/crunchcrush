import type { ComboDeal, PromoCode } from '@/types'

export const mockPromos: PromoCode[] = [
  { id: 'promo-1', code: 'KARIBU10', description: '10% off your first order', type: 'percentage', value: 10, minOrder: 5000, maxDiscount: 3000, validFrom: '2026-01-01T00:00:00Z', validTo: '2027-06-30T23:59:59Z', usedCount: 214, isActive: true },
  { id: 'promo-2', code: 'TACOTUESDAY', description: 'RWF 1,500 off orders over RWF 10,000', type: 'fixed', value: 1500, minOrder: 10000, validFrom: '2026-01-01T00:00:00Z', validTo: '2027-12-31T23:59:59Z', usageLimit: 1000, usedCount: 388, isActive: true },
  { id: 'promo-3', code: 'FREEDEL', description: 'Free delivery on orders over RWF 8,000', type: 'free_delivery', value: 0, minOrder: 8000, validFrom: '2026-01-01T00:00:00Z', validTo: '2027-12-31T23:59:59Z', usedCount: 97, isActive: true },
  { id: 'promo-4', code: 'SUMMER25', description: 'Expired summer promo', type: 'percentage', value: 25, minOrder: 0, validFrom: '2026-06-01T00:00:00Z', validTo: '2026-08-31T23:59:59Z', usedCount: 512, isActive: false },
]

export const mockCombos: ComboDeal[] = [
  { id: 'combo-deal-1', name: 'Taco + Passion', description: 'Chicken tacos with a fresh passion juice', itemIds: ['taco-chicken', 'drink-passion'], price: 6500, isActive: true },
  { id: 'combo-deal-2', name: 'Roll-Egg Breakfast Duo', description: 'Two classic roll-eggs and two coffees', itemIds: ['rolex-classic', 'drink-coffee'], price: 8000, isActive: false },
]
