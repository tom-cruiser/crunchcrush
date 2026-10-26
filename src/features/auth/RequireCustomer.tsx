import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'

/** Customer-only screens send guests to sign in and bring them back afterwards. */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const customer = useAuth((s) => s.customer)
  const { pathname } = useLocation()
  if (!customer) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
  return <>{children}</>
}
