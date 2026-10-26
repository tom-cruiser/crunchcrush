import type { Rider, Staff, User } from '@/types'

export const mockStaff: Staff[] = [
  { id: 'staff-owner', name: 'Aline Uwase', phone: '+250788100001', email: 'owner@crunchcrust.rw', role: 'owner', isActive: true, createdAt: '2025-11-01T08:00:00Z' },
  { id: 'staff-manager', name: 'Eric Mugisha', phone: '+250788100002', email: 'manager@crunchcrust.rw', role: 'manager', isActive: true, createdAt: '2025-11-03T08:00:00Z' },
  { id: 'staff-cashier', name: 'Diane Ingabire', phone: '+250788100003', email: 'cashier@crunchcrust.rw', role: 'cashier', isActive: true, createdAt: '2026-01-10T08:00:00Z' },
  { id: 'staff-kitchen', name: 'Jean Bosco Habimana', phone: '+250788100004', email: 'kitchen@crunchcrust.rw', role: 'kitchen', isActive: true, createdAt: '2026-01-10T08:00:00Z' },
  { id: 'staff-rider-1', name: 'Patrick Niyonzima', phone: '+250788100005', email: 'rider1@crunchcrust.rw', role: 'rider', isActive: true, createdAt: '2026-02-01T08:00:00Z' },
  { id: 'staff-rider-2', name: 'Claude Hakizimana', phone: '+250788100006', email: 'rider2@crunchcrust.rw', role: 'rider', isActive: true, createdAt: '2026-03-15T08:00:00Z' },
]

export const mockRiders: Rider[] = [
  { id: 'rider-1', staffId: 'staff-rider-1', name: 'Patrick Niyonzima', phone: '+250788100005', vehicle: 'motorbike', plateNumber: 'RC 482 B', status: 'on_delivery', currentLocation: { lat: -1.9502, lng: 30.1012 }, activeOrderIds: ['ord-1006'] },
  { id: 'rider-2', staffId: 'staff-rider-2', name: 'Claude Hakizimana', phone: '+250788100006', vehicle: 'motorbike', plateNumber: 'RD 117 A', status: 'available', activeOrderIds: [] },
]

export const mockCustomers: User[] = [
  {
    id: 'user-1',
    name: 'Grace Mukamana',
    phone: '+250788555001',
    email: 'grace@example.com',
    favouriteItemIds: ['taco-chicken', 'rolex-chicken', 'drink-passion'],
    createdAt: '2026-03-02T10:00:00Z',
    addresses: [
      { id: 'addr-1', label: 'Home', street: 'KG 9 Ave, 34', area: 'Kacyiru', city: 'Kigali', instructions: 'Blue gate, ring twice', coordinates: { lat: -1.9441, lng: 30.0921 }, isDefault: true },
      { id: 'addr-2', label: 'Work', street: 'KN 4 Ave, Kigali Heights', area: 'Kimihurura', city: 'Kigali', coordinates: { lat: -1.9524, lng: 30.0925 } },
    ],
  },
  { id: 'user-2', name: 'Kevin Ishimwe', phone: '+250788555002', favouriteItemIds: ['taco-beef'], createdAt: '2026-05-14T10:00:00Z', addresses: [{ id: 'addr-3', label: 'Home', street: 'KK 15 Rd, 8', area: 'Kicukiro', city: 'Kigali', coordinates: { lat: -1.9706, lng: 30.1044 }, isDefault: true }] },
  { id: 'user-3', name: 'Sandrine Uwimana', phone: '+250788555003', email: 'sandrine@example.com', favouriteItemIds: [], createdAt: '2026-08-20T10:00:00Z', addresses: [] },
  { id: 'user-4', name: 'Olivier Nshuti', phone: '+250788555004', favouriteItemIds: ['rolex-classic'], createdAt: '2026-09-01T10:00:00Z', addresses: [] },
]

/** Demo staff logins: any of these emails with password "demo1234". */
export const DEMO_STAFF_PASSWORD = 'demo1234'
/** Demo customer OTP code for every phone number. */
export const DEMO_OTP = '123456'
