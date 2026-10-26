import { useState } from 'react'
import { AlertTriangle, MapPin, Phone, Printer, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ordersApi, staffApi } from '@/api'
import { Badge, Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { Can } from '@/features/auth/RequireStaff'
import { PriceSummary } from '@/features/cart/components/PriceSummary'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { StatusTimeline } from '@/features/orders/components/StatusTimeline'
import { isActive } from '@/features/orders/status'
import { cn } from '@/lib/cn'
import { formatDateTime, formatPhone, formatRelative, formatTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { Order, OrderStatus, RestaurantSettings } from '@/types'
import { awaitingPayment } from './AdminOrderCard'

const PREP_TIMES = [10, 15, 20, 30, 45, 60]
const REJECT_REASONS = ['Kitchen too busy', 'Item unavailable', 'Outside delivery area', 'Closing soon', 'Suspected fake order']

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn('rounded-full border px-3.5 py-2 text-sm font-semibold', selected ? 'border-ink bg-brand text-brand-fg' : 'border-line hover:border-ink')}
    >
      {children}
    </button>
  )
}

const openPrint = (orderId: string, type: 'kitchen' | 'receipt') => window.open(`/admin/print/${orderId}?type=${type}`, '_blank', 'noopener,width=420,height=700')

interface Props {
  order?: Order
  settings: RestaurantSettings
  onClose: () => void
  onUpdated: (order: Order) => void
}

export function OrderDetailSheet({ order, settings, onClose, onUpdated }: Props) {
  return (
    <Modal open={Boolean(order)} onClose={onClose} title={order ? `Order ${order.orderNumber}` : ''} size="lg">
      {order && <OrderDetail key={order.id} order={order} settings={settings} onClose={onClose} onUpdated={onUpdated} />}
    </Modal>
  )
}

function OrderDetail({ order, settings, onClose, onUpdated }: Required<Props>) {
  const { t } = useTranslation()
  const defaultPrep = settings.defaultPrepTimeMinutes + (settings.busyMode ? settings.busyExtraMinutes : 0)
  const [prep, setPrep] = useState(order.prepTimeMinutes ?? defaultPrep)
  const [mode, setMode] = useState<'idle' | 'reject' | 'cancel'>('idle')
  const [reason, setReason] = useState('')
  const [riderId, setRiderId] = useState(order.riderId ?? '')
  const [busy, setBusy] = useState(false)
  const riders = useAsync(() => staffApi.listRiders(), [], 'riders')

  const run = async (fn: () => Promise<Order>, message: string, close = false) => {
    setBusy(true)
    try {
      const updated = await fn()
      onUpdated(updated)
      toast.success(message)
      setMode('idle')
      if (close) onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const advance = (status: OrderStatus, label: string) => run(() => ordersApi.updateOrderStatus(order.id, status), `${order.orderNumber}: ${label}`)
  const availableRiders = riders.data?.filter((r) => r.status !== 'offline') ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} fulfillment={order.fulfillment} />
        <Badge tone="outline">{t(`fulfillment.${order.fulfillment}`)}</Badge>
        {order.scheduledFor && <Badge tone="info">Scheduled {formatDateTime(order.scheduledFor)}</Badge>}
        <span className="text-sm text-ink-soft">
          {formatDateTime(order.createdAt)} · {formatRelative(order.createdAt)}
        </span>
      </div>

      {awaitingPayment(order) && isActive(order.status) && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t(`payment.${order.paymentMethod}`)} payment {order.paymentStatus === 'failed' ? 'failed' : 'not confirmed yet'}. Check before preparing.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm">
          <h3 className="mb-1 font-bold">Customer</h3>
          <p>{order.customerName}</p>
          <Can permission="customers.view">
            <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-2">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {formatPhone(order.customerPhone)}
            </a>
          </Can>
        </div>
        {order.address && (
          <div className="text-sm">
            <h3 className="mb-1 font-bold">Deliver to</h3>
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {order.address.street}, {order.address.area}
                {order.address.instructions && <span className="block text-ink-soft italic">{order.address.instructions}</span>}
              </span>
            </p>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-bold">Items</h3>
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
          {order.items.map((line) => (
            <li key={line.lineId} className="p-3 text-sm">
              <p className="text-base font-bold">
                {line.quantity}× {line.name}
              </p>
              {line.selectedOptions.map((o) => (
                <p key={o.optionId} className="text-ink-soft">
                  {o.optionName}: {o.choiceNames.join(', ')}
                </p>
              ))}
              {line.selectedAddOns.map((a) => (
                <p key={a.addOnId} className="text-ink-soft">
                  + {a.quantity > 1 ? `${a.quantity}× ` : ''}
                  {a.name}
                </p>
              ))}
              {line.removedIngredients.length > 0 && <p className="font-bold text-danger">NO {line.removedIngredients.join(', NO ').toUpperCase()}</p>}
              {line.note && <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 font-semibold text-warning">“{line.note}”</p>}
            </li>
          ))}
        </ul>
      </section>

      <Can permission="customers.view">
        <section className="rounded-xl bg-muted p-3">
          <PriceSummary pricing={order.pricing} settings={settings} promo={order.promoCode ? { code: order.promoCode, type: 'fixed' } : undefined} showDelivery={order.fulfillment === 'delivery'} />
          <p className="mt-2 text-sm">
            Payment: <span className="font-semibold">{t(`payment.${order.paymentMethod}`)}</span> · {order.paymentStatus}
          </p>
        </section>
      </Can>

      {(order.rejectionReason || order.cancellationReason) && <p className="text-sm font-semibold text-danger">Reason: {order.rejectionReason ?? order.cancellationReason}</p>}

      <Can permission="orders.manage">
        {isActive(order.status) && (
          <section className="flex flex-col gap-3 rounded-xl border border-ink p-4">
            {mode !== 'idle' ? (
              <>
                <h3 className="font-bold">{mode === 'reject' ? 'Reject order' : 'Cancel order'}</h3>
                <div className="flex flex-wrap gap-2">
                  {REJECT_REASONS.map((r) => (
                    <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>
                      {r}
                    </Chip>
                  ))}
                </div>
                <Textarea label="Reason shown to the customer" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setMode('idle')}>
                    Back
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    disabled={reason.trim().length < 3}
                    loading={busy}
                    onClick={() =>
                      mode === 'reject'
                        ? run(() => ordersApi.rejectOrder(order.id, reason.trim()), `${order.orderNumber} rejected`, true)
                        : run(() => ordersApi.updateOrderStatus(order.id, 'cancelled', reason.trim()), `${order.orderNumber} cancelled`, true)
                    }
                  >
                    {mode === 'reject' ? 'Reject order' : 'Cancel order'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {(order.status === 'received' || order.status === 'accepted' || order.status === 'preparing') && (
                  <div>
                    <p className="mb-2 font-bold">Prep time</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {PREP_TIMES.map((m) => (
                        <Chip key={m} selected={prep === m} onClick={() => setPrep(m)}>
                          {m} min
                        </Chip>
                      ))}
                      <Input aria-label="Custom prep time in minutes" type="number" min={1} max={240} value={prep} onChange={(e) => setPrep(Math.max(1, Number(e.target.value) || 1))} className="h-10 w-20" />
                    </div>
                    {order.status !== 'received' && prep !== order.prepTimeMinutes && (
                      <Button className="mt-2" size="sm" variant="outline" loading={busy} onClick={() => run(() => ordersApi.updatePrepTime(order.id, prep), 'Prep time updated')}>
                        Update estimate
                      </Button>
                    )}
                    {order.estimatedReadyAt && order.status !== 'received' && <p className="mt-2 text-sm text-ink-soft">Ready by {formatTime(order.estimatedReadyAt)}</p>}
                  </div>
                )}

                {order.status === 'ready' && order.fulfillment === 'delivery' && (
                  <Select label="Rider" value={riderId} onChange={(e) => setRiderId(e.target.value)}>
                    <option value="">Choose a rider…</option>
                    {availableRiders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.status === 'available' ? 'available' : `${r.activeOrderIds.length} on the road`}
                      </option>
                    ))}
                  </Select>
                )}

                <div className="flex flex-wrap gap-2">
                  {order.status === 'received' && (
                    <>
                      <Button size="lg" className="flex-1" loading={busy} onClick={() => run(() => ordersApi.acceptOrder(order.id, prep), `${order.orderNumber} accepted · ${prep} min`)}>
                        Accept · {prep} min
                      </Button>
                      <Button size="lg" variant="outline" onClick={() => setMode('reject')}>
                        Reject
                      </Button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <Button size="lg" className="flex-1" loading={busy} onClick={() => advance('preparing', 'preparing')}>
                      Start preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button size="lg" className="flex-1" loading={busy} onClick={() => advance('ready', 'ready')}>
                      Mark ready
                    </Button>
                  )}
                  {order.status === 'ready' && order.fulfillment === 'delivery' && (
                    <Button
                      size="lg"
                      className="flex-1"
                      disabled={!riderId}
                      loading={busy}
                      onClick={() =>
                        run(async () => {
                          await ordersApi.assignRider(order.id, riderId)
                          return ordersApi.updateOrderStatus(order.id, 'out_for_delivery')
                        }, `${order.orderNumber} out for delivery`)
                      }
                    >
                      Send out with rider
                    </Button>
                  )}
                  {order.status === 'ready' && order.fulfillment === 'pickup' && (
                    <Button size="lg" className="flex-1" loading={busy} onClick={() => advance('delivered', 'collected')}>
                      Mark collected
                    </Button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <Button size="lg" className="flex-1" loading={busy} onClick={() => advance('delivered', 'delivered')}>
                      Mark delivered
                    </Button>
                  )}
                  {order.status !== 'received' && (
                    <Button size="lg" variant="ghost" onClick={() => setMode('cancel')}>
                      Cancel order
                    </Button>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </Can>

      <section className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <h3 className="mb-2 font-bold">Timeline</h3>
          <StatusTimeline order={order} />
        </div>
        <div className="flex flex-row gap-2 sm:flex-col">
          <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={() => openPrint(order.id, 'kitchen')}>
            Kitchen ticket
          </Button>
          <Can permission="customers.view">
            <Button variant="outline" size="sm" leftIcon={<Receipt className="h-4 w-4" />} onClick={() => openPrint(order.id, 'receipt')}>
              Receipt
            </Button>
          </Can>
        </div>
      </section>
    </div>
  )
}
