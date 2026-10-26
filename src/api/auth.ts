import type { Address, ID, Staff, User } from '@/types'
import { uid } from '@/lib/id'
import { ApiError, mock, notFound } from './client'
import { db } from './mock/db'
import { DEMO_OTP, DEMO_STAFF_PASSWORD } from './mock/people'

export interface Session<T> {
  token: string
  user: T
}

const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('250')) return `+${digits}`
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`
  return `+250${digits}`
}

/** POST /api/auth/otp — sends an SMS code. In the mock every code is 123456. */
export function requestOtp(phone: string): Promise<{ phone: string; expiresInSeconds: number }> {
  return mock(() => ({ phone: normalizePhone(phone), expiresInSeconds: 120 }), { write: true })
}

/** POST /api/auth/otp/verify — signs in, creating the customer on first login. */
export function verifyOtp(phone: string, code: string): Promise<Session<User>> {
  return mock(
    () => {
      if (code !== DEMO_OTP) throw new ApiError('otp_invalid', 'That code is not correct.')
      const normalized = normalizePhone(phone)
      let user = db.customers.find((c) => c.phone === normalized)
      if (!user) {
        user = { id: uid('user'), name: '', phone: normalized, addresses: [], favouriteItemIds: [], createdAt: new Date().toISOString() }
        db.customers.push(user)
      }
      return { token: `mock-${user.id}`, user }
    },
    { write: true },
  )
}

/** POST /api/auth/email — customer email login. The mock accepts any password of 6+ characters for a known email. */
export function loginWithEmail(email: string, password: string): Promise<Session<User>> {
  return mock(
    () => {
      const normalized = email.trim().toLowerCase()
      const user = db.customers.find((c) => c.email?.toLowerCase() === normalized)
      if (!user && db.staff.some((s) => s.email.toLowerCase() === normalized)) throw new ApiError('staff_account', 'This is a staff account. Sign in on the staff login page.')
      if (!user || password.length < 6) throw new ApiError('invalid_credentials', 'Email or password is incorrect.')
      return { token: `mock-${user.id}`, user }
    },
    { write: true },
  )
}

/** POST /api/staff/auth */
export function staffLogin(email: string, password: string): Promise<Session<Staff>> {
  return mock(
    () => {
      const staff = db.staff.find((s) => s.email.toLowerCase() === email.trim().toLowerCase() && s.isActive)
      if (!staff || password !== DEMO_STAFF_PASSWORD) throw new ApiError('invalid_credentials', 'Email or password is incorrect.')
      return { token: `mock-staff-${staff.id}`, user: staff }
    },
    { write: true },
  )
}

const findUser = (id: ID) => db.customers.find((c) => c.id === id) ?? notFound('User')

/** GET /api/me */
export function getProfile(userId: ID): Promise<User> {
  return mock(() => findUser(userId))
}

/** PATCH /api/me */
export function updateProfile(userId: ID, patch: Pick<User, 'name'> & Partial<Pick<User, 'email'>>): Promise<User> {
  return mock(
    () => {
      const user = findUser(userId)
      Object.assign(user, patch)
      return user
    },
    { write: true },
  )
}

/** PUT /api/me/addresses/:id (or POST when new) */
export function saveAddress(userId: ID, input: Omit<Address, 'id'> & { id?: ID }): Promise<User> {
  return mock(
    () => {
      const user = findUser(userId)
      const address: Address = { ...input, id: input.id ?? uid('addr') }
      if (address.isDefault || user.addresses.length === 0) {
        user.addresses.forEach((a) => (a.isDefault = false))
        address.isDefault = true
      }
      const index = user.addresses.findIndex((a) => a.id === address.id)
      if (index >= 0) user.addresses[index] = address
      else user.addresses.push(address)
      return user
    },
    { write: true },
  )
}

/** DELETE /api/me/addresses/:id */
export function deleteAddress(userId: ID, addressId: ID): Promise<User> {
  return mock(
    () => {
      const user = findUser(userId)
      user.addresses = user.addresses.filter((a) => a.id !== addressId)
      if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true
      return user
    },
    { write: true },
  )
}

/** POST /api/me/favourites/:itemId/toggle */
export function toggleFavourite(userId: ID, itemId: ID): Promise<User> {
  return mock(
    () => {
      const user = findUser(userId)
      user.favouriteItemIds = user.favouriteItemIds.includes(itemId)
        ? user.favouriteItemIds.filter((id) => id !== itemId)
        : [...user.favouriteItemIds, itemId]
      return user
    },
    { write: true, minDelay: 100, maxDelay: 200 },
  )
}
