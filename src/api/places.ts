import type { Coordinates } from '@/types'
import { http } from './http'

export interface Place {
  id: string
  name: string
  area: string
  city: string
  coordinates: Coordinates
}

/** GET /api/places?q= */
export function searchPlaces(query: string): Promise<Place[]> {
  return http('/places', { query: { q: query.trim() } })
}

/** GET /api/places/reverse?lat&lng — names the nearest known place. */
export function reverseGeocode(point: Coordinates): Promise<Place> {
  return http('/places/reverse', { query: { lat: point.lat, lng: point.lng } })
}
