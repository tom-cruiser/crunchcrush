import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardX, Clock, CreditCard, MapPin, MessageSquareWarning, Phone, RotateCcw, Store, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, ordersApi } from '@/api'
import { Badge, Button, ButtonAnchor, ButtonLink, Card, CardBody, EmptyState, ErrorState, Modal, Skeleton, Textarea } from '@/components/ui'
import { PriceSummary } from '@/features/cart/components/PriceSummary'
import { describeCustomization } from '@/features/menu/customization'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { ProblemReportSheet } from '@/features/orders/components/ProblemReportSheet'
import { RatingCard } from '@/features/orders/components/RatingCard'
import { RiderCard } from '@/features/orders/components/RiderCard'
import { StatusTimeline } from '@/features/orders/components/StatusTimeline'
import { expectedAt, isActive, statusLabel } from '@/features/orders/status'
import { useReorder } from '@/features/orders/useReorder'
import { useSettings } from '@/features/store/useSettings'
import { formatDate, formatDateTime, formatMoney, formatTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { Order } from '@/types'

const POLL_MS = 4000

function TrackingSkeleton() {
  return (
    <div role="status" aria-label="Loading order" className="mx-auto flex max-w-2xl flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-36 w-full rounded-card" />
      <Skeleton className="h-64 w-full rounded-card" />
    </div>
  )
}

export default function OrderTrackingPage() {
  const { t } = useTranslation()
  const { orderId = '' } = useParams()
  const order = useAsync(() => ordersApi.getOrder(orderId), [orderId])
  const { data: settings } = useSettings()
  const { reorder, ready: reorderReady } = useReorder()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [problemOpen, setProblemOpen] = useState(false)

  // Keep refreshing while the order is still moving.
  const active = order.data ? isActive(order.data.status) : false
  const { reload } = order
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => void reload(), POLL_MS)
    return () => clearInterval(id)
  }, [active, reload])

  if (order.error && !order.data) {
    if (order.error instanceof ApiError && order.error.code === 'not_found') {
      return (
        <EmptyState
          icon={<ClipboardX className="h-6 w-6" />}
          title={t('tracking.notFound')}
          action={
            <ButtonLink to="/orders" variant="outline">{t('orders.title')}</ButtonLink>
          }
        />
      )
    }
    return <ErrorState error={order.error} onRetry={order.reload} />
  }
  if (!order.data || !settings) return <TrackingSkeleton />

  const o = order.data
  const update = (next: Order) => order.setData(next)
  const eta = expectedAt(o)
  const failed = o.status === 'rejected' || o.status === 'cancelled'
  const infoKey = o.status === 'ready' && o.fulfillment === 'pickup' ? 'readyPickup' : o.status
  const unpaid = o.paymentMethod !== 'cash' && (o.paymentStatus === 'pending' || o.paymentStatus === 'failed') && !failed

  const cancel = async () => {
    setCancelling(true)
    try {
      update(await ordersApi.cancelOrder(o.id, cancelReason.trim() || 'Cancelled by customer'))
      toast.show(t('tracking.cancelled'))
      setCancelOpen(false)
    } catch (e) {
      toast.error((e as Error).message)
      void order.reload()
      setCancelOpen(false)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/orders" aria-label={t('common.back')} className="-ml-2 rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold">{t('tracking.title', { number: o.orderNumber })}</h1>
          <p className="text-sm text-ink-soft">{formatDateTime(o.createdAt)}</p>
        </div>
        <OrderStatusBadge status={o.status} fulfillment={o.fulfillment} />
      </div>

      <Card className={failed ? 'border-danger' : 'border-ink'}>
        <CardBody className="flex flex-col gap-2" aria-live="polite">
          <p className="text-2xl font-extrabold">{statusLabel(t, o.status, o.fulfillment)}</p>
          <p className="text-ink-soft">{t(`statusInfo.${infoKey}`)}</p>
          {failed && (o.rejectionReason || o.cancellationReason) && <p className="text-sm font-semibold">{t('tracking.reason', { reason: o.rejectionReason ?? o.cancellationReason })}</p>}
          {active && eta && (
            <p className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {o.scheduledFor ? t('tracking.scheduledFor', { time: formatDateTime(o.scheduledFor) }) : t('tracking.eta', { time: formatTime(eta) })}
            </p>
          )}
          {active && (
            <p className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" />
              {t('tracking.live')}
            </p>
          )}
          {unpaid && (
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3">
              <CreditCard className="h-5 w-5 text-warning" aria-hidden="true" />
              <span className="flex-1 text-sm font-semibold text-warning">{o.paymentStatus === 'failed' ? t('tracking.paymentFailed') : t('tracking.paymentPending')}</span>
              <ButtonLink to={`/checkout/pay/${o.id}`} size="sm">{t('tracking.completePayment')}</ButtonLink>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <ButtonAnchor href={`tel:${settings.phone}`} variant="outline" size="sm" leftIcon={<Phone className="h-4 w-4" />}>
                {t('tracking.callRestaurant')}
              </ButtonAnchor>
            {o.status === 'received' && (
              <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)}>
                {t('tracking.cancel')}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {o.status === 'out_for_delivery' && o.fulfillment === 'delivery' && <RiderCard orderId={o.id} destination={o.address?.coordinates} />}

      <Card>
        <CardBody>
          <StatusTimeline order={o} />
        </CardBody>
      </Card>

      {o.status === 'delivered' && <RatingCard order={o} onRated={update} />}

      {(o.status === 'delivered' || o.problemReports.length > 0) && (
        <Card>
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">{t('tracking.help')}</h2>
              <Button variant="outline" size="sm" leftIcon={<MessageSquareWarning className="h-4 w-4" />} onClick={() => setProblemOpen(true)}>
                {t('rating.reportProblem')}
              </Button>
            </div>
            {o.problemReports.length > 0 && (
              <ul className="flex flex-col gap-2 text-sm">
                {o.problemReports.map((p) => (
                  <li key={p.id} className="rounded-xl bg-muted p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{t(`rating.types.${p.type}`)}</span>
                      <Badge tone={p.resolved ? 'success' : 'warning'}>{p.resolved ? 'Resolved' : 'Open'}</Badge>
                    </div>
                    <p className="mt-1 text-ink-soft">{p.message}</p>
                    <p className="mt-1 text-xs text-ink-faint">{formatDate(p.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="flex flex-col gap-4 text-sm">
          <h2 className="text-base font-bold">{t('tracking.details')}</h2>
          <p className="flex items-start gap-2">
            {o.fulfillment === 'delivery' ? <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> : o.fulfillment === 'pickup' ? <Store className="mt-0.5 h-4 w-4 shrink-0" /> : <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              {o.fulfillment === 'delivery' && o.address && (
                <>
                  <span className="font-semibold">{t('tracking.deliverTo')}</span>
                  <span className="block text-ink-soft">
                    {o.address.street}, {o.address.area}
                  </span>
                  {o.address.instructions && <span className="block text-ink-soft italic">{o.address.instructions}</span>}
                </>
              )}
              {o.fulfillment === 'pickup' && (
                <>
                  <span className="font-semibold">{t('tracking.pickupAt')}</span>
                  <span className="block text-ink-soft">
                    {settings.address.street}, {settings.address.area}
                  </span>
                </>
              )}
              {o.fulfillment === 'dine-in' && <span className="font-semibold">{t('tracking.table', { n: o.tableNumber })}</span>}
            </span>
          </p>
          <ul className="flex flex-col gap-2 border-t border-line pt-3">
            {o.items.map((line) => (
              <li key={line.lineId} className="flex justify-between gap-3">
                <span>
                  <span className="font-semibold">
                    {line.quantity}× {line.name}
                  </span>
                  {describeCustomization(line) && <span className="block text-xs text-ink-soft">{describeCustomization(line)}</span>}
                  {line.note && <span className="block text-xs text-ink-soft italic">“{line.note}”</span>}
                </span>
                <span className="tabular-nums">{formatMoney(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-3">
            <PriceSummary pricing={o.pricing} settings={settings} promo={o.promoCode ? { code: o.promoCode, type: 'fixed' } : undefined} showDelivery={o.fulfillment === 'delivery'} />
          </div>
          <p className="flex justify-between border-t border-line pt-3">
            <span>{t('tracking.payment')}</span>
            <span className="font-semibold">
              {t(`payment.${o.paymentMethod}`)} ·{' '}
              {o.paymentStatus === 'paid' ? t('tracking.paid') : o.paymentStatus === 'refunded' ? t('tracking.refunded') : o.paymentStatus === 'failed' ? t('tracking.paymentFailed') : t('tracking.paymentPending')}
            </span>
          </p>
        </CardBody>
      </Card>

      {!active && (
        <Button size="lg" variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => reorder(o)} disabled={!reorderReady}>
          {t('tracking.reorder')}
        </Button>
      )}

      <ProblemReportSheet order={o} open={problemOpen} onClose={() => setProblemOpen(false)} onReported={update} />
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t('tracking.cancel')}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setCancelOpen(false)}>
              {t('tracking.keepOrder')}
            </Button>
            <Button variant="danger" fullWidth onClick={cancel} loading={cancelling}>
              {t('tracking.cancel')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-ink-soft">{t('tracking.cancelConfirm')}</p>
          <Textarea label={t('tracking.cancelReason')} rows={2} maxLength={200} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
