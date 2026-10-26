import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ClipboardList, ShoppingBag, User, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { prefetchWhenIdle } from '@/lib/prefetch'
import { ActiveOrderBanner } from '@/features/orders/components/ActiveOrderBanner'
import { useOrderWatcher } from '@/features/orders/useOrderWatcher'
import { OfflineBanner } from '@/features/pwa/OfflineBanner'
import { selectCartCount, useCart } from '@/store/cart'
import { PageLoader } from './PageLoader'
import { StoreStatusBadge } from './StoreStatusBadge'

function CartButton({ className }: { className?: string }) {
  const count = useCart(selectCartCount)
  const { t } = useTranslation()
  return (
    <Link to="/cart" className={cn('relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-fg', className)} aria-label={t('nav.cartWithCount', { count })}>
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1 text-xs font-bold text-ink ring-2 ring-brand">
          {count}
        </span>
      )}
    </Link>
  )
}

export function CustomerLayout() {
  const { t } = useTranslation()
  useOrderWatcher()
  useEffect(() => {
    prefetchWhenIdle([
      () => import('@/pages/customer/CartPage'),
      () => import('@/pages/customer/CheckoutPage'),
      () => import('@/pages/customer/OrderTrackingPage'),
      () => import('@/pages/customer/OrdersPage'),
    ])
  }, [])
  const tabs = [
    { to: '/', label: t('nav.menu'), icon: UtensilsCrossed, end: true },
    { to: '/orders', label: t('nav.orders'), icon: ClipboardList },
    { to: '/account', label: t('nav.account'), icon: User },
  ]
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded bg-brand px-3 py-2 text-brand-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        {t('nav.skipToContent')}
      </a>
      <OfflineBanner />
      <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-9 w-9" width={36} height={36} />
            <span className="text-lg font-extrabold tracking-tight">{t('common.appName')}</span>
          </Link>
          <StoreStatusBadge />
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => cn('rounded-full px-4 py-2 text-sm font-semibold', isActive ? 'bg-muted text-ink' : 'text-ink-soft hover:text-ink')}>
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <CartButton className="ml-auto md:ml-2" />
        </div>
      </header>
      <ActiveOrderBanner />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-10">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <nav aria-label="Main" className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden">
        <div className="grid grid-cols-3">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-xs font-semibold', isActive ? 'text-ink' : 'text-ink-faint')}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
