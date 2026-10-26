import type { Coordinates, DeliveryZone, ID, RestaurantSettings } from '@/types'
import { distanceKm } from '@/lib/geo'
import { uid } from '@/lib/id'
import { mock } from './client'
import { db } from './mock/db'

/** GET /api/settings */
export function getSettings(): Promise<RestaurantSettings> {
  return mock(() => db.settings, { minDelay: 150, maxDelay: 300 })
}

/** PATCH /api/admin/settings */
export function updateSettings(patch: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
  return mock(
    () => {
      Object.assign(db.settings, patch)
      return db.settings
    },
    { write: true },
  )
}

/** GET /api/delivery-zones */
export function getDeliveryZones(): Promise<DeliveryZone[]> {
  return mock(() => [...db.zones].sort((a, b) => a.radiusKm - b.radiusKm))
}

export interface ZoneCheck {
  deliverable: boolean
  distanceKm: number
  zone?: DeliveryZone
}

/** POST /api/delivery-zones/check — finds the smallest active zone containing the point. */
export function checkDeliveryZone(point: Coordinates): Promise<ZoneCheck> {
  return mock(() => {
    const distance = distanceKm(db.settings.address.coordinates, point)
    const zone = db.zones.filter((z) => z.isActive && distance <= z.radiusKm).sort((a, b) => a.radiusKm - b.radiusKm)[0]
    return { deliverable: Boolean(zone), distanceKm: Math.round(distance * 10) / 10, zone }
  })
}

/** PUT /api/admin/delivery-zones/:id */
export function saveDeliveryZone(input: Omit<DeliveryZone, 'id'> & { id?: ID }): Promise<DeliveryZone> {
  return mock(
    () => {
      const zone: DeliveryZone = { ...input, id: input.id ?? uid('zone') }
      const index = db.zones.findIndex((z) => z.id === zone.id)
      if (index >= 0) db.zones[index] = zone
      else db.zones.push(zone)
      return zone
    },
    { write: true },
  )
}

/** DELETE /api/admin/delivery-zones/:id */
export function deleteDeliveryZone(id: ID): Promise<void> {
  return mock(
    () => {
      db.zones = db.zones.filter((z) => z.id !== id)
    },
    { write: true },
  )
}
