import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ClipboardList, Heart, ShoppingBag, User, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { prefetchWhenIdle } from '@/lib/prefetch'
import { ActiveOrderBanner } from '@/features/orders/components/ActiveOrderBanner'
import { useOrderWatcher } from '@/features/orders/useOrderWatcher'
import { OfflineBanner } from '@/features/pwa/OfflineBanner'
import { selectCartCount, useCart } from '@/store/cart'
import { PageLoader } from './PageLoader'
import { StoreStatusBadge } from './StoreStatusBadge'

function CartButton({ className, inverted }: { className?: string; inverted?: boolean }) {
  const count = useCart(selectCartCount)
  const { t } = useTranslation()
  return (
    <Link
      to="/cart"
      className={cn('relative h-11 w-11 items-center justify-center rounded-full', inverted ? 'bg-surface text-ink' : 'bg-brand text-brand-fg', className)}
      aria-label={t('nav.cartWithCount', { count })}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className={cn('absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ring-2', inverted ? 'bg-brand text-brand-fg ring-surface' : 'bg-surface text-ink ring-brand')}>
          {count}
        </span>
      )}
    </Link>
  )
}

/** Raised round cart button in the middle of the phone tab bar. */
function TabBarCart() {
  const count = useCart(selectCartCount)
  const { t } = useTranslation()
  return (
    <NavLink to="/cart" aria-label={t('nav.cartWithCount', { count })} className="flex flex-col items-center justify-end gap-1 pb-2.5 text-xs font-semibold text-ink">
      <span className="relative -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-fg shadow-lg ring-4 ring-surface">
        <ShoppingBag className="h-6 w-6" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1 text-xs font-bold text-ink ring-2 ring-brand">{count}</span>
        )}
      </span>
      <span aria-hidden="true">{t('nav.cart')}</span>
    </NavLink>
  )
}

export function CustomerLayout() {
  const { t } = useTranslation()
  // The menu has a dark hero, so the top bar turns dark to run into it.
  const { pathname } = useLocation()
  const dark = pathname === '/'
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
  // Phones get a favourites tab too, with the cart raised in the middle.
  const phoneTabs = [...tabs.slice(0, 2), { to: '/account/favourites', label: t('account.favourites'), icon: Heart, end: false }, tabs[2]]
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded bg-brand px-3 py-2 text-brand-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        {t('nav.skipToContent')}
      </a>
      <OfflineBanner />
      <header className={cn('no-print sticky top-0 z-30 border-b backdrop-blur', dark ? 'border-transparent bg-brand text-brand-fg' : 'border-line bg-surface/95')}>
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className={cn('h-9 w-9 rounded-xl', dark && 'ring-1 ring-white/30')} width={36} height={36} />
            <span className="text-lg font-extrabold tracking-tight">{t('common.appName')}</span>
          </Link>
          {!dark && <StoreStatusBadge />}
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) => cn('rounded-full px-4 py-2 text-sm font-semibold', isActive ? 'bg-muted text-ink' : dark ? 'text-white/75 hover:text-white' : 'text-ink-soft hover:text-ink')}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <CartButton className="ml-2 hidden md:inline-flex" inverted={dark} />
        </div>
      </header>
      <ActiveOrderBanner />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-32 md:pb-10">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <nav aria-label="Main" className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden">
        <div className="grid grid-cols-5">
          {[...phoneTabs.slice(0, 2), null, ...phoneTabs.slice(2)].map((tab) =>
            tab ? (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                // Favourites lives under /account, so Account steps aside there.
                className={({ isActive }) =>
                  cn('flex flex-col items-center gap-1 py-2.5 text-xs font-semibold', isActive && !(tab.to === '/account' && pathname.startsWith('/account/favourites')) ? 'text-ink' : 'text-ink-faint')
                }
              >
                <tab.icon className="h-5 w-5" aria-hidden="true" />
                {tab.label}
              </NavLink>
            ) : (
              <TabBarCart key="cart" />
            ),
          )}
        </div>
      </nav>
    </div>
  )
}
