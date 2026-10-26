import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, Bike, ClipboardList, LogOut, Menu as MenuIcon, Settings, Tag, Truck, Users, UtensilsCrossed, X, Contact } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { can, ROLE_LABELS, type Permission } from '@/features/auth/permissions'
import { OfflineBanner } from '@/features/pwa/OfflineBanner'
import { useAuth } from '@/store/auth'
import { PageLoader } from './PageLoader'
import { StoreStatusBadge } from './StoreStatusBadge'

const NAV: { to: string; key: string; icon: typeof ClipboardList; permission: Permission }[] = [
  { to: '/admin/orders', key: 'admin.liveOrders', icon: ClipboardList, permission: 'orders.view' },
  { to: '/admin/menu', key: 'admin.menu', icon: UtensilsCrossed, permission: 'menu.view' },
  { to: '/admin/delivery', key: 'admin.delivery', icon: Truck, permission: 'delivery.manage' },
  { to: '/admin/promotions', key: 'admin.promotions', icon: Tag, permission: 'promotions.manage' },
  { to: '/admin/reports', key: 'admin.reports', icon: BarChart3, permission: 'reports.view' },
  { to: '/admin/customers', key: 'admin.customers', icon: Contact, permission: 'customers.view' },
  { to: '/admin/staff', key: 'admin.staff', icon: Users, permission: 'staff.manage' },
  { to: '/admin/settings', key: 'admin.settings', icon: Settings, permission: 'settings.manage' },
]

export function AdminLayout() {
  const { t } = useTranslation()
  const { staff, signOutStaff } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const items = NAV.filter((n) => can(staff?.role, n.permission))

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1 p-3">
      {items.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold', isActive ? 'bg-brand text-brand-fg' : 'text-ink-soft hover:bg-muted hover:text-ink')}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {t(key)}
        </NavLink>
      ))}
      {can(staff?.role, 'rider.app') && (
        <NavLink to="/rider" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-muted hover:text-ink">
          <Bike className="h-5 w-5" aria-hidden="true" />
          Rider view
        </NavLink>
      )}
    </nav>
  )

  const footer = staff && (
    <div className="border-t border-line p-3">
      <p className="truncate text-sm font-semibold">{staff.name}</p>
      <p className="text-xs text-ink-soft">{ROLE_LABELS[staff.role]}</p>
      <button
        type="button"
        onClick={() => {
          signOutStaff()
          navigate('/admin/login')
        }}
        className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {t('admin.signOut')}
      </button>
    </div>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-muted">
      <OfflineBanner />
      <div className="flex flex-1">
        <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-line px-4">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-extrabold">Crunch Crust</span>
          </div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          {footer}
        </aside>

        {drawerOpen && (
          <div className="no-print fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 animate-fade-in flex-col bg-surface">
              <div className="flex h-16 items-center justify-between border-b border-line px-4">
                <span className="font-extrabold">Crunch Crust</span>
                <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="rounded-full p-2 hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{nav}</div>
              {footer}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4">
            <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="-ml-2 rounded-full p-2 hover:bg-muted lg:hidden">
              <MenuIcon className="h-5 w-5" />
            </button>
            <span className="font-bold lg:hidden">Admin</span>
            <StoreStatusBadge />
          </header>
          <main id="main" className="flex-1 p-4 lg:p-6">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
