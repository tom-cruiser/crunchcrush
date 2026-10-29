import type { ComboDeal, ID, Money, PromoCode } from '@/types'
import { http } from './http'

/** POST /api/promos/validate — returns the promo when it can be applied to this subtotal. */
export function validatePromoCode(code: string, subtotal: Money): Promise<PromoCode> {
  return http('/promos/validate', { method: 'POST', body: { code, subtotal } })
}

/** GET /api/admin/promos */
export function listPromoCodes(): Promise<PromoCode[]> {
  return http('/admin/promos')
}

/** PUT /api/admin/promos/:id (or POST when new) */
export function savePromoCode(input: Omit<PromoCode, 'id' | 'usedCount'> & { id?: ID; usedCount?: number }): Promise<PromoCode> {
  const { usedCount: _usedCount, ...body } = input
  return input.id ? http(`/admin/promos/${encodeURIComponent(input.id)}`, { method: 'PUT', body }) : http('/admin/promos', { method: 'POST', body })
}

/** DELETE /api/admin/promos/:id */
export function deletePromoCode(id: ID): Promise<void> {
  return http(`/admin/promos/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** GET /api/combos */
export function listCombos(): Promise<ComboDeal[]> {
  return http('/combos')
}

/** PUT /api/admin/combos/:id (or POST when new) */
export function saveCombo(input: Omit<ComboDeal, 'id'> & { id?: ID }): Promise<ComboDeal> {
  return input.id ? http(`/admin/combos/${encodeURIComponent(input.id)}`, { method: 'PUT', body: input }) : http('/admin/combos', { method: 'POST', body: input })
}

/** DELETE /api/admin/combos/:id */
export function deleteCombo(id: ID): Promise<void> {
  return http(`/admin/combos/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
