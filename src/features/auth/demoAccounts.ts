import type { StaffRole } from '@/types'

/** Demo sign-ins shown as one-tap buttons. Every account uses the same password. */
export const DEMO_PASSWORD = 'demo1234'

export const DEMO_STAFF_ACCOUNTS: { role: StaffRole; email: string }[] = [
  { role: 'owner', email: 'owner@crunchcrust.rw' },
  { role: 'manager', email: 'manager@crunchcrust.rw' },
  { role: 'cashier', email: 'cashier@crunchcrust.rw' },
  { role: 'kitchen', email: 'kitchen@crunchcrust.rw' },
  { role: 'rider', email: 'rider1@crunchcrust.rw' },
]

export const DEMO_CUSTOMER_EMAIL = 'grace@example.com'
