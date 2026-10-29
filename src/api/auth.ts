import type { Address, ID, Staff, User } from '@/types'
import { http } from './http'

export interface Session<T> {
  token: string
  user: T
}

/** POST /api/auth/otp — sends an SMS code. */
export function requestOtp(phone: string): Promise<{ phone: string; expiresInSeconds: number }> {
  return http('/auth/otp', { method: 'POST', body: { phone } })
}

/** POST /api/auth/otp/verify — signs in, creating the customer on first login. */
export function verifyOtp(phone: string, code: string): Promise<Session<User>> {
  return http('/auth/otp/verify', { method: 'POST', body: { phone, code } })
}

/** POST /api/auth/email — customer email login. */
export function loginWithEmail(email: string, password: string): Promise<Session<User>> {
  return http('/auth/email', { method: 'POST', body: { email, password } })
}

/** POST /api/staff/auth */
export function staffLogin(email: string, password: string): Promise<Session<Staff>> {
  return http('/staff/auth', { method: 'POST', body: { email, password } })
}

/** POST /api/staff/auth/setup — first password from an invite link. Signs the staff member in. */
export function setupStaffPassword(token: string, password: string): Promise<Session<Staff>> {
  return http('/staff/auth/setup', { method: 'POST', body: { token, password } })
}

/** POST /api/staff/auth/reset/request — emails a reset link if the account exists. */
export function requestStaffPasswordReset(email: string): Promise<void> {
  return http('/staff/auth/reset/request', { method: 'POST', body: { email } })
}

/** POST /api/staff/auth/reset — new password from a reset link. Signs the staff member in. */
export function resetStaffPassword(token: string, password: string): Promise<Session<Staff>> {
  return http('/staff/auth/reset', { method: 'POST', body: { token, password } })
}

// The signed-in customer comes from the token; the id arguments are kept for the callers.

/** GET /api/me */
export function getProfile(_userId: ID): Promise<User> {
  return http('/me')
}

/** PATCH /api/me */
export function updateProfile(_userId: ID, patch: Pick<User, 'name'> & Partial<Pick<User, 'email'>>): Promise<User> {
  return http('/me', { method: 'PATCH', body: patch })
}

/** PUT /api/me/addresses/:id (or POST when new) */
export function saveAddress(_userId: ID, input: Omit<Address, 'id'> & { id?: ID }): Promise<User> {
  return input.id ? http(`/me/addresses/${encodeURIComponent(input.id)}`, { method: 'PUT', body: input }) : http('/me/addresses', { method: 'POST', body: input })
}

/** DELETE /api/me/addresses/:id */
export function deleteAddress(_userId: ID, addressId: ID): Promise<User> {
  return http(`/me/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE' })
}

/** POST /api/me/favourites/:itemId/toggle */
export function toggleFavourite(_userId: ID, itemId: ID): Promise<User> {
  return http(`/me/favourites/${encodeURIComponent(itemId)}/toggle`, { method: 'POST' })
}
