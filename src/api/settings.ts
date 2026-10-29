import type { Coordinates, DeliveryZone, ID, RestaurantSettings } from '@/types'
import { http } from './http'

/** GET /api/settings */
export function getSettings(): Promise<RestaurantSettings> {
  return http('/settings')
}

/** A settings change. `whatsapp: null` removes the WhatsApp number. */
export type SettingsPatch = Partial<Omit<RestaurantSettings, 'whatsapp'>> & { whatsapp?: string | null }

/** PATCH /api/admin/settings */
export function updateSettings(patch: SettingsPatch): Promise<RestaurantSettings> {
  return http('/admin/settings', { method: 'PATCH', body: patch })
}

/** GET /api/delivery-zones */
export function getDeliveryZones(): Promise<DeliveryZone[]> {
  return http('/delivery-zones')
}

export interface ZoneCheck {
  deliverable: boolean
  distanceKm: number
  zone?: DeliveryZone
}

/** POST /api/delivery-zones/check — finds the smallest active zone containing the point. */
export function checkDeliveryZone(point: Coordinates): Promise<ZoneCheck> {
  return http('/delivery-zones/check', { method: 'POST', body: point })
}

/** PUT /api/admin/delivery-zones/:id (or POST when new) */
export function saveDeliveryZone(input: Omit<DeliveryZone, 'id'> & { id?: ID }): Promise<DeliveryZone> {
  return input.id ? http(`/admin/delivery-zones/${encodeURIComponent(input.id)}`, { method: 'PUT', body: input }) : http('/admin/delivery-zones', { method: 'POST', body: input })
}

/** DELETE /api/admin/delivery-zones/:id */
export function deleteDeliveryZone(id: ID): Promise<void> {
  return http(`/admin/delivery-zones/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
