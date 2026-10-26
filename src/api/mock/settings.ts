import type { DeliveryZone, RestaurantSettings } from '@/types'

export const RESTAURANT_LOCATION = { lat: -1.9536, lng: 30.0937 }

export const mockSettings: RestaurantSettings = {
  name: 'Crunch Crust',
  tagline: 'Tacos & Roll-Eggs, made fresh in Kigali',
  phone: '+250788000111',
  whatsapp: '+250788000111',
  email: 'hello@crunchcrust.rw',
  address: {
    id: 'addr-restaurant',
    label: 'Restaurant',
    street: 'KG 7 Ave, 12',
    area: 'Kimihurura',
    city: 'Kigali',
    coordinates: RESTAURANT_LOCATION,
  },
  currency: 'RWF',
  locale: 'en-RW',
  timezone: 'Africa/Kigali',
  logoUrl: '/favicon.svg',
  coverUrl: '/images/cover.svg',
  isOpen: true,
  busyMode: false,
  busyExtraMinutes: 15,
  openingHours: [
    { day: 'mon', open: '07:00', close: '22:00', closed: false },
    { day: 'tue', open: '07:00', close: '22:00', closed: false },
    { day: 'wed', open: '07:00', close: '22:00', closed: false },
    { day: 'thu', open: '07:00', close: '22:00', closed: false },
    { day: 'fri', open: '07:00', close: '23:30', closed: false },
    { day: 'sat', open: '09:00', close: '23:30', closed: false },
    { day: 'sun', open: '10:00', close: '21:00', closed: false },
  ],
  holidayClosures: [
    { id: 'hol-1', date: '2026-12-25', reason: 'Christmas Day' },
    { id: 'hol-2', date: '2027-01-01', reason: 'New Year’s Day' },
  ],
  minimumOrder: 3000,
  taxRatePercent: 18,
  taxInclusive: true,
  serviceChargePercent: 5,
  defaultPrepTimeMinutes: 20,
  enabledPaymentMethods: ['mtn_momo', 'airtel_money', 'card', 'cash'],
  fulfillmentTypes: ['delivery', 'pickup', 'dine-in'],
  tableCount: 14,
}

export const mockZones: DeliveryZone[] = [
  { id: 'zone-1', name: 'Kimihurura & Kacyiru', radiusKm: 3, fee: 1000, minOrder: 3000, estimatedMinutes: 25, isActive: true },
  { id: 'zone-2', name: 'Remera, Kiyovu, Nyarutarama', radiusKm: 6, fee: 2000, minOrder: 5000, estimatedMinutes: 40, isActive: true },
  { id: 'zone-3', name: 'Greater Kigali', radiusKm: 12, fee: 3500, minOrder: 10000, estimatedMinutes: 60, isActive: true },
]
