import type { StaffRole } from '@/types'

export type Permission =
  | 'orders.view'
  | 'orders.manage'
  | 'menu.view'
  | 'menu.edit'
  | 'menu.availability'
  | 'delivery.manage'
  | 'settings.manage'
  | 'promotions.manage'
  | 'staff.manage'
  | 'reports.view'
  | 'customers.view'
  | 'rider.app'

const ALL: Permission[] = [
  'orders.view',
  'orders.manage',
  'menu.view',
  'menu.edit',
  'menu.availability',
  'delivery.manage',
  'settings.manage',
  'promotions.manage',
  'staff.manage',
  'reports.view',
  'customers.view',
  'rider.app',
]

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  owner: ALL,
  manager: ALL.filter((p) => p !== 'staff.manage'),
  cashier: ['orders.view', 'orders.manage', 'menu.view', 'menu.availability', 'customers.view'],
  // Kitchen sees the order queue and can mark items sold out, nothing else.
  kitchen: ['orders.view', 'orders.manage', 'menu.view', 'menu.availability'],
  rider: ['rider.app'],
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner / Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  kitchen: 'Kitchen',
  rider: 'Rider',
}

export function can(role: StaffRole | undefined, permission: Permission): boolean {
  return Boolean(role && ROLE_PERMISSIONS[role].includes(permission))
}

/** Where a role lands after signing in. */
export function homeForRole(role: StaffRole): string {
  return role === 'rider' ? '/rider' : '/admin/orders'
}
