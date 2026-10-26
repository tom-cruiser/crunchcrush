import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { can, type Permission } from './permissions'

/** Route guard: signed-in staff with the given permission, otherwise login or a no-access screen. */
export function RequireStaff({ permission, children }: { permission: Permission; children: ReactNode }) {
  const staff = useAuth((s) => s.staff)
  const location = useLocation()
  const { t } = useTranslation()
  if (!staff) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!can(staff.role, permission)) {
    return <EmptyState icon={<ShieldOff className="h-6 w-6" />} title={t('admin.noAccess')} description={`Signed in as ${staff.name}.`} />
  }
  return <>{children}</>
}

/** UI guard: renders children only when the signed-in staff member has the permission. */
export function Can({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  const role = useAuth((s) => s.staff?.role)
  return <>{can(role, permission) ? children : fallback}</>
}
