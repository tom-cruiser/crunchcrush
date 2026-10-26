import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { statusLabel } from '../status'
import { useActiveOrders } from '../useOrderWatcher'

/** Slim banner on customer screens linking to the most recent in-progress order. */
export function ActiveOrderBanner() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const orders = useActiveOrders((s) => s.orders)
  const order = orders[0]
  if (!order || pathname.startsWith('/order/') || pathname.startsWith('/checkout')) return null
  const more = orders.length - 1
  return (
    <aside aria-label={t('tracking.activeOrder')}>
      <Link to={`/order/${order.id}`} className="no-print flex items-center gap-3 border-b border-line bg-muted px-4 py-2.5 text-sm font-semibold">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-40" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ink" />
        </span>
        <span className="flex-1">
          {t('tracking.activeBanner', { number: order.orderNumber, status: statusLabel(t, order.status, order.fulfillment) })}
          {more > 0 && <span className="text-ink-soft"> +{more}</span>}
        </span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </aside>
  )
}
