import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Staff, User } from '@/types'

interface AuthState {
  customer?: User
  customerToken?: string
  staff?: Staff
  staffToken?: string
  setCustomer: (user: User, token?: string) => void
  signOutCustomer: () => void
  setStaff: (staff: Staff, token: string) => void
  signOutStaff: () => void
}

/** Customer and staff sessions are separate so a cashier can test the customer app on the same device. */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      setCustomer: (customer, token) => set((s) => ({ customer, customerToken: token ?? s.customerToken })),
      signOutCustomer: () => set({ customer: undefined, customerToken: undefined }),
      setStaff: (staff, staffToken) => set({ staff, staffToken }),
      signOutStaff: () => set({ staff: undefined, staffToken: undefined }),
    }),
    { name: 'cc-auth', version: 1 },
  ),
)
