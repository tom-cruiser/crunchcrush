import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, RotateCcw, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ordersApi } from '@/api'
import { Button, ButtonLink, Card, EmptyState, ErrorState, SkeletonList } from '@/components/ui'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { StarDisplay } from '@/features/orders/components/StarRating'
import { isActive } from '@/features/orders/status'
import { useReorder } from '@/features/orders/useReorder'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { useAuth } from '@/store/auth'
import { usePreferences } from '@/store/preferences'
import type { Order } from '@/types'

function OrderCard({ order, onReorder, reorderReady }: { order: Order; onReorder: (o: Order) => void; reorderReady: boolean }) {
  const { t } = useTranslation()
  const count = order.items.reduce((n, i) => n + i.quantity, 0)
  const names = order.items.map((i) => i.name)
  const summary = names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ')
  const active = isActive(order.status)
  return (
    <Card>
      <Link to={`/order/${order.id}`} className="flex items-start gap-3 p-4 hover:bg-muted/50">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} fulfillment={order.fulfillment} />
          </div>
          <p className="mt-1 truncate text-sm">{summary}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {formatDateTime(order.createdAt)} · {t(`fulfillment.${order.fulfillment}`)} · {t('orders.items', { count })}
          </p>
        </div>
        <div className="flex items-center gap-1 text-right">
          <span className="font-bold tabular-nums">{formatMoney(order.pricing.total)}</span>
          <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
        </div>
      </Link>
      {!active && (
        <div className="flex items-center gap-2 border-t border-line px-4 py-2">
          {order.rating ? (
            <StarDisplay value={order.rating.food} />
          ) : (
            order.status === 'delivered' && (
              <Link to={`/order/${order.id}`} className="flex items-center gap-1 text-sm font-semibold underline underline-offset-2">
                <Star className="h-4 w-4" aria-hidden="true" />
                {t('orders.rate')}
              </Link>
            )
          )}
          <Button size="sm" variant="ghost" className="ml-auto" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => onReorder(order)} disabled={!reorderReady}>
            {t('tracking.reorder')}
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const customer = useAuth((s) => s.customer)
  const guestOrderIds = usePreferences((s) => s.guestOrderIds)
  const orders = useAsync(
    () => (customer ? ordersApi.listCustomerOrders(customer.id) : ordersApi.listOrdersByIds(guestOrderIds)),
    [customer?.id, guestOrderIds.join(',')],
    `orders:${customer?.id ?? 'guest'}`,
  )
  const { reorder, ready } = useReorder()

  const list = orders.data ?? []
  const active = list.filter((o) => isActive(o.status))
  const past = list.filter((o) => !isActive(o.status))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('orders.title')}</h1>
      {!customer && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm">
          {t('orders.guestNote')}{' '}
          <Link to="/login?next=/orders" className="font-semibold underline underline-offset-2">
            {t('auth.signIn')}
          </Link>
        </p>
      )}
      {orders.error && !orders.data ? (
        <ErrorState error={orders.error} onRetry={orders.reload} />
      ) : !orders.data ? (
        <SkeletonList rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title={t('orders.empty')}
          description={t('orders.emptyBody')}
          action={
            <ButtonLink to="/">{t('cart.browseMenu')}</ButtonLink>
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <section aria-labelledby="active-orders" className="flex flex-col gap-3">
              <h2 id="active-orders" className="font-bold">
                {t('orders.active')}
              </h2>
              {active.map((o) => (
                <OrderCard key={o.id} order={o} onReorder={reorder} reorderReady={ready} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section aria-labelledby="past-orders" className="flex flex-col gap-3">
              <h2 id="past-orders" className="font-bold">
                {t('orders.past')}
              </h2>
              {past.map((o) => (
                <OrderCard key={o.id} order={o} onReorder={reorder} reorderReady={ready} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
