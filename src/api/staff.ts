import type { Coordinates, ID, Order, Rider, RiderStatus, Staff } from '@/types'
import { http } from './http'

/** GET /api/admin/staff */
export function listStaff(): Promise<Staff[]> {
  return http('/admin/staff')
}

/** PUT /api/admin/staff/:id (or POST when new — the new staff member gets an invite email) */
export function saveStaff(input: Omit<Staff, 'id' | 'createdAt'> & { id?: ID }): Promise<Staff> {
  return input.id ? http(`/admin/staff/${encodeURIComponent(input.id)}`, { method: 'PUT', body: input }) : http('/admin/staff', { method: 'POST', body: input })
}

/** DELETE /api/admin/staff/:id */
export function deleteStaff(id: ID): Promise<void> {
  return http(`/admin/staff/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** GET /api/admin/riders */
export function listRiders(): Promise<Rider[]> {
  return http('/admin/riders')
}

/** PATCH /api/riders/:id/status */
export function setRiderStatus(id: ID, status: RiderStatus): Promise<Rider> {
  return http(`/riders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })
}

/** PATCH /api/admin/riders/:id — vehicle details. */
export function saveRider(id: ID, patch: Pick<Rider, 'vehicle' | 'plateNumber'>): Promise<Rider> {
  return http(`/admin/riders/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })
}

// The signed-in rider comes from the staff token; the id arguments are kept for the callers.

/** GET /api/riders/me */
export function getMyRider(_staffId: ID): Promise<Rider> {
  return http('/riders/me')
}

/** POST /api/riders/me/location — shown to the customer on the tracking page. */
export function updateRiderLocation(_id: ID, location: Coordinates): Promise<Rider> {
  return http('/riders/me/location', { method: 'POST', body: location })
}

/** GET /api/riders/me/deliveries?since — completed deliveries, newest first. */
export function listRiderHistory(_staffId: ID, since: string): Promise<Order[]> {
  return http('/riders/me/deliveries', { query: { since } })
}

/** GET /api/riders/me/orders — deliveries assigned to the signed-in rider. */
export function listRiderOrders(_staffId: ID): Promise<Order[]> {
  return http('/riders/me/orders')
}
