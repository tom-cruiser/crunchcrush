import type { Coordinates } from '@/types'
import { mock } from './client'

export interface Place {
  id: string
  name: string
  area: string
  city: string
  coordinates: Coordinates
}

/** Stand-in for a geocoding provider (Google Places, Mapbox…). Known Kigali neighbourhoods plus a few far-away towns. */
const PLACES: Place[] = [
  { id: 'pl-kimihurura', name: 'Kimihurura', area: 'Kimihurura', city: 'Kigali', coordinates: { lat: -1.9536, lng: 30.0937 } },
  { id: 'pl-kacyiru', name: 'Kacyiru', area: 'Kacyiru', city: 'Kigali', coordinates: { lat: -1.9441, lng: 30.0921 } },
  { id: 'pl-kigali-heights', name: 'Kigali Heights', area: 'Kimihurura', city: 'Kigali', coordinates: { lat: -1.9524, lng: 30.0925 } },
  { id: 'pl-convention', name: 'Kigali Convention Centre', area: 'Kimihurura', city: 'Kigali', coordinates: { lat: -1.9545, lng: 30.0934 } },
  { id: 'pl-remera', name: 'Remera', area: 'Remera', city: 'Kigali', coordinates: { lat: -1.9578, lng: 30.1127 } },
  { id: 'pl-amahoro', name: 'Amahoro Stadium', area: 'Remera', city: 'Kigali', coordinates: { lat: -1.9556, lng: 30.1186 } },
  { id: 'pl-nyarutarama', name: 'Nyarutarama', area: 'Nyarutarama', city: 'Kigali', coordinates: { lat: -1.9367, lng: 30.1033 } },
  { id: 'pl-kiyovu', name: 'Kiyovu', area: 'Kiyovu', city: 'Kigali', coordinates: { lat: -1.9496, lng: 30.0606 } },
  { id: 'pl-cbd', name: 'City Centre (CBD)', area: 'Nyarugenge', city: 'Kigali', coordinates: { lat: -1.9441, lng: 30.0619 } },
  { id: 'pl-kicukiro', name: 'Kicukiro Centre', area: 'Kicukiro', city: 'Kigali', coordinates: { lat: -1.9706, lng: 30.1044 } },
  { id: 'pl-kimironko', name: 'Kimironko', area: 'Kimironko', city: 'Kigali', coordinates: { lat: -1.949, lng: 30.126 } },
  { id: 'pl-kibagabaga', name: 'Kibagabaga', area: 'Kibagabaga', city: 'Kigali', coordinates: { lat: -1.93, lng: 30.115 } },
  { id: 'pl-gikondo', name: 'Gikondo', area: 'Gikondo', city: 'Kigali', coordinates: { lat: -1.975, lng: 30.075 } },
  { id: 'pl-nyamirambo', name: 'Nyamirambo', area: 'Nyamirambo', city: 'Kigali', coordinates: { lat: -1.9787, lng: 30.0434 } },
  { id: 'pl-kanombe', name: 'Kanombe', area: 'Kanombe', city: 'Kigali', coordinates: { lat: -1.9686, lng: 30.14 } },
  { id: 'pl-gisozi', name: 'Gisozi', area: 'Gisozi', city: 'Kigali', coordinates: { lat: -1.9196, lng: 30.0617 } },
  { id: 'pl-rebero', name: 'Rebero', area: 'Rebero', city: 'Kigali', coordinates: { lat: -1.99, lng: 30.07 } },
  { id: 'pl-nyamata', name: 'Nyamata', area: 'Bugesera', city: 'Nyamata', coordinates: { lat: -2.1489, lng: 30.0926 } },
  { id: 'pl-musanze', name: 'Musanze', area: 'Musanze', city: 'Musanze', coordinates: { lat: -1.4996, lng: 29.6344 } },
]

/** GET /api/places?q= */
export function searchPlaces(query: string): Promise<Place[]> {
  return mock(
    () => {
      const q = query.trim().toLowerCase()
      if (!q) return PLACES.slice(0, 8)
      return PLACES.filter((p) => `${p.name} ${p.area} ${p.city}`.toLowerCase().includes(q)).slice(0, 8)
    },
    { minDelay: 120, maxDelay: 300 },
  )
}

/** GET /api/places/reverse?lat&lng — names the nearest known place. */
export function reverseGeocode(point: Coordinates): Promise<Place> {
  return mock(() => {
    const nearest = [...PLACES].sort(
      (a, b) => Math.hypot(a.coordinates.lat - point.lat, a.coordinates.lng - point.lng) - Math.hypot(b.coordinates.lat - point.lat, b.coordinates.lng - point.lng),
    )[0]
    return { ...nearest, id: 'pl-current', name: 'Current location', coordinates: point }
  })
}
