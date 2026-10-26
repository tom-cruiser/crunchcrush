import { CalendarClock, CreditCard, MessageSquare, Bike, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { cn } from '@/lib/cn'
import { formatMoney, formatRelative, formatTime } from '@/lib/format'
import type { Order } from '@/types'

const ICON = { delivery: Bike, pickup: Store }

export const awaitingPayment = (o: Order) => o.paymentMethod !== 'cash' && o.paymentStatus !== 'paid' && o.paymentStatus !== 'refunded'

export function AdminOrderCard({ order, onOpen, showPrices }: { order: Order; onOpen: () => void; showPrices: boolean }) {
  const { t } = useTranslation()
  const Icon = ICON[order.fulfillment]
  const count = order.items.reduce((n, i) => n + i.quantity, 0)
  const hasNotes = order.items.some((i) => i.note || i.removedIngredients.length)
  const isNew = order.status === 'received'
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn('flex w-full flex-col gap-2 rounded-xl border bg-surface p-3 text-left shadow-sm transition-shadow hover:shadow-md', isNew ? 'border-ink ring-2 ring-ink/10' : 'border-line')}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-extrabold">{order.orderNumber}</span>
        <OrderStatusBadge status={order.status} fulfillment={order.fulfillment} />
        <span className="ml-auto text-xs text-ink-soft">{formatRelative(order.createdAt)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-semibold">
          {t(`fulfillment.${order.fulfillment}`)}
        </span>
        <span className="truncate text-ink-soft">· {order.customerName}</span>
      </div>
      <p className="line-clamp-2 text-sm text-ink-soft">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="outline">{count} items</Badge>
        {showPrices && <Badge tone="outline">{formatMoney(order.pricing.total)}</Badge>}
        {order.scheduledFor && (
          <Badge tone="info">
            <CalendarClock className="h-3 w-3" aria-hidden="true" /> {formatTime(order.scheduledFor)}
          </Badge>
        )}
        {hasNotes && (
          <Badge tone="warning">
            <MessageSquare className="h-3 w-3" aria-hidden="true" /> Notes
          </Badge>
        )}
        {awaitingPayment(order) && (
          <Badge tone="danger">
            <CreditCard className="h-3 w-3" aria-hidden="true" /> {order.paymentStatus === 'failed' ? 'Payment failed' : 'Awaiting payment'}
          </Badge>
        )}
        {order.estimatedReadyAt && (order.status === 'accepted' || order.status === 'preparing') && <span className="ml-auto text-xs font-semibold">Ready {formatTime(order.estimatedReadyAt)}</span>}
      </div>
    </button>
  )
}
