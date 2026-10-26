import type { Coordinates, ID, Order, Rider, RiderStatus, Staff } from '@/types'
import { uid } from '@/lib/id'
import { ApiError, mock, notFound } from './client'
import { db } from './mock/db'

/** GET /api/admin/staff */
export function listStaff(): Promise<Staff[]> {
  return mock(() => db.staff)
}

/** PUT /api/admin/staff/:id */
export function saveStaff(input: Omit<Staff, 'id' | 'createdAt'> & { id?: ID }): Promise<Staff> {
  return mock(
    () => {
      const existing = input.id ? db.staff.find((s) => s.id === input.id) : undefined
      if (existing?.role === 'owner' && input.role !== 'owner' && db.staff.filter((s) => s.role === 'owner').length === 1) {
        throw new ApiError('last_owner', 'There must always be at least one owner.')
      }
      if (db.staff.some((s) => s.id !== input.id && s.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError('duplicate_email', 'Someone already uses this email.')
      }
      const staff: Staff = { createdAt: existing?.createdAt ?? new Date().toISOString(), ...input, id: input.id ?? uid('staff') }
      if (existing) Object.assign(existing, staff)
      else db.staff.push(staff)
      syncRider(staff)
      return staff
    },
    { write: true },
  )
}

/** DELETE /api/admin/staff/:id */
export function deleteStaff(id: ID): Promise<void> {
  return mock(
    () => {
      const staff = db.staff.find((s) => s.id === id)
      if (staff?.role === 'owner' && db.staff.filter((s) => s.role === 'owner').length === 1) {
        throw new ApiError('last_owner', 'There must always be at least one owner.')
      }
      if (db.riders.some((r) => r.staffId === id && r.activeOrderIds.length > 0)) {
        throw new ApiError('rider_busy', 'This rider still has deliveries assigned.')
      }
      db.staff = db.staff.filter((s) => s.id !== id)
      db.riders = db.riders.filter((r) => r.staffId !== id)
    },
    { write: true },
  )
}

/** Every staff member with the rider role has a matching rider profile. */
function syncRider(staff: Staff) {
  const rider = db.riders.find((r) => r.staffId === staff.id)
  if (staff.role === 'rider' && !rider) {
    db.riders.push({ id: uid('rider'), staffId: staff.id, name: staff.name, phone: staff.phone, vehicle: 'motorbike', status: 'offline', activeOrderIds: [] })
  } else if (rider) {
    rider.name = staff.name
    rider.phone = staff.phone
    if (staff.role !== 'rider' || !staff.isActive) rider.status = 'offline'
  }
}

/** GET /api/admin/riders */
export function listRiders(): Promise<Rider[]> {
  return mock(() => db.riders)
}

/** PATCH /api/riders/:id/status */
export function setRiderStatus(id: ID, status: RiderStatus): Promise<Rider> {
  return mock(
    () => {
      const rider = db.riders.find((r) => r.id === id) ?? notFound('Rider')
      rider.status = status
      return rider
    },
    { write: true },
  )
}

/** PATCH /api/admin/riders/:id — vehicle details. */
export function saveRider(id: ID, patch: Pick<Rider, 'vehicle' | 'plateNumber'>): Promise<Rider> {
  return mock(
    () => {
      const rider = db.riders.find((r) => r.id === id) ?? notFound('Rider')
      Object.assign(rider, patch)
      return rider
    },
    { write: true },
  )
}

/** GET /api/riders/me */
export function getMyRider(staffId: ID): Promise<Rider> {
  return mock(() => db.riders.find((r) => r.staffId === staffId) ?? notFound('Rider profile'))
}

/** POST /api/riders/me/location — shown to the customer on the tracking page. */
export function updateRiderLocation(id: ID, location: Coordinates): Promise<Rider> {
  return mock(
    () => {
      const rider = db.riders.find((r) => r.id === id) ?? notFound('Rider')
      rider.currentLocation = location
      return rider
    },
    { write: true, minDelay: 50, maxDelay: 150 },
  )
}

/** GET /api/riders/me/deliveries?since — completed deliveries, newest first. */
export function listRiderHistory(staffId: ID, since: string): Promise<Order[]> {
  return mock(() => {
    const rider = db.riders.find((r) => r.staffId === staffId)
    if (!rider) return []
    return db.orders
      .filter((o) => o.riderId === rider.id && o.status === 'delivered' && o.updatedAt >= since)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  })
}

/** GET /api/riders/me/orders — deliveries assigned to the signed-in rider. */
export function listRiderOrders(staffId: ID): Promise<Order[]> {
  return mock(() => {
    const rider = db.riders.find((r) => r.staffId === staffId)
    if (!rider) return []
    return db.orders.filter((o) => o.riderId === rider.id && (o.status === 'ready' || o.status === 'out_for_delivery'))
  })
}
