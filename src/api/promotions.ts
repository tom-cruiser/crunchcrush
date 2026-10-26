import type { ComboDeal, ID, Money, PromoCode } from '@/types'
import { uid } from '@/lib/id'
import { ApiError, mock } from './client'
import { db } from './mock/db'

/** POST /api/promos/validate — returns the promo when it can be applied to this subtotal. */
export function validatePromoCode(code: string, subtotal: Money): Promise<PromoCode> {
  return mock(() => {
    const promo = db.promos.find((p) => p.code.toUpperCase() === code.trim().toUpperCase())
    const now = new Date().toISOString()
    if (!promo || !promo.isActive || now < promo.validFrom || now > promo.validTo) {
      throw new ApiError('promo_invalid', 'This code is not valid.')
    }
    if (promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) {
      throw new ApiError('promo_used_up', 'This code has reached its usage limit.')
    }
    if (subtotal < promo.minOrder) {
      throw new ApiError('promo_min_order', `Spend at least ${promo.minOrder} RWF to use this code.`)
    }
    return promo
  })
}

/** GET /api/admin/promos */
export function listPromoCodes(): Promise<PromoCode[]> {
  return mock(() => db.promos)
}

/** PUT /api/admin/promos/:id */
export function savePromoCode(input: Omit<PromoCode, 'id' | 'usedCount'> & { id?: ID; usedCount?: number }): Promise<PromoCode> {
  return mock(
    () => {
      const promo: PromoCode = { usedCount: 0, ...input, id: input.id ?? uid('promo'), code: input.code.toUpperCase() }
      if (db.promos.some((p) => p.code === promo.code && p.id !== promo.id)) throw new ApiError('duplicate', 'That code already exists.')
      const index = db.promos.findIndex((p) => p.id === promo.id)
      if (index >= 0) db.promos[index] = promo
      else db.promos.push(promo)
      return promo
    },
    { write: true },
  )
}

/** DELETE /api/admin/promos/:id */
export function deletePromoCode(id: ID): Promise<void> {
  return mock(
    () => {
      db.promos = db.promos.filter((p) => p.id !== id)
    },
    { write: true },
  )
}

/** GET /api/combos */
export function listCombos(): Promise<ComboDeal[]> {
  return mock(() => db.combos)
}

/** PUT /api/admin/combos/:id */
export function saveCombo(input: Omit<ComboDeal, 'id'> & { id?: ID }): Promise<ComboDeal> {
  return mock(
    () => {
      const combo: ComboDeal = { ...input, id: input.id ?? uid('combo-deal') }
      const index = db.combos.findIndex((c) => c.id === combo.id)
      if (index >= 0) db.combos[index] = combo
      else db.combos.push(combo)
      return combo
    },
    { write: true },
  )
}

/** DELETE /api/admin/combos/:id */
export function deleteCombo(id: ID): Promise<void> {
  return mock(
    () => {
      db.combos = db.combos.filter((c) => c.id !== id)
    },
    { write: true },
  )
}
