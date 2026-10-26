import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Banknote, CheckCircle2, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react'
import { ordersApi, staffApi } from '@/api'
import { Badge, Button, Card, EmptyState, ErrorState, Modal, SkeletonList, Switch } from '@/components/ui'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { useShareLocation } from '@/features/rider/useShareLocation'
import { formatMoney, formatPhone, formatTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'
import type { Order } from '@/types'

const POLL_MS = 10_000

/** Start of today in Kigali (UTC+2), as an ISO instant. */
const startOfKigaliDay = () => {
  const now = new Date(Date.now() + 2 * 3_600_000)
  return new Date(`${now.toISOString().slice(0, 10)}T00:00:00+02:00`).toISOString()
}

export default function RiderPage() {
  const { t } = useTranslation()
  const staff = useAuth((s) => s.staff)!
  const rider = useAsync(() => staffApi.getMyRider(staff.id), [staff.id])
  const active = useAsync(() => staffApi.listRiderOrders(staff.id), [staff.id])
  const history = useAsync(() => staffApi.listRiderHistory(staff.id, startOfKigaliDay()), [staff.id])
  const [sharing, setSharing] = useState(() => localStorage.getItem('cc-rider-share') === '1')
  const [confirming, setConfirming] = useState<Order>()
  const [busyId, setBusyId] = useState<string>()
  const location = useShareLocation(rider.data?.id, sharing)

  // Poll for newly assigned deliveries.
  useEffect(() => {
    const id = window.setInterval(() => {
      active.reload()
      rider.reload()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [])

  const toggleSharing = (on: boolean) => {
    setSharing(on)
    try {
      localStorage.setItem('cc-rider-share', on ? '1' : '0')
    } catch {
      // Preference just won't persist.
    }
  }

  const setAvailable = async (on: boolean) => {
    if (!rider.data) return
    try {
      rider.setData(await staffApi.setRiderStatus(rider.data.id, on ? 'available' : 'offline'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const advance = async (order: Order, status: 'out_for_delivery' | 'delivered') => {
    setBusyId(order.id)
    try {
      await ordersApi.updateOrderStatus(order.id, status)
      if (status === 'delivered') {
        toast.success(t('rider.deliveredToast', { number: order.orderNumber }))
        setConfirming(undefined)
        history.reload()
        rider.reload()
      }
      active.reload()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(undefined)
    }
  }

  if (rider.error && !rider.data) {
    return (rider.error as { code?: string }).code === 'not_found' ? <EmptyState title={t('rider.noProfile')} /> : <ErrorState error={rider.error} onRetry={rider.reload} />
  }
  if (!rider.data) return <SkeletonList rows={3} />

  const done = history.data ?? []
  const cash = done.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.pricing.total, 0)

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-4">
        <Switch
          label={rider.data.status === 'on_delivery' ? t('rider.onDelivery') : t('rider.available')}
          description={t('rider.availableHint')}
          checked={rider.data.status !== 'offline'}
          disabled={rider.data.status === 'on_delivery'}
          onChange={setAvailable}
        />
        <Switch label={t('rider.shareLocation')} description={t('rider.shareLocationHint')} checked={sharing} onChange={toggleSharing} />
        {location === 'denied' && <p className="text-sm font-semibold text-danger">{t('rider.locationDenied')}</p>}
        {location === 'unsupported' && <p className="text-sm font-semibold text-danger">{t('rider.locationUnsupported')}</p>}
      </Card>

      <section aria-labelledby="active-heading" className="flex flex-col gap-3">
        <h1 id="active-heading" className="text-xl font-extrabold">
          {t('rider.active')}
        </h1>
        {active.error && !active.data ? (
          <ErrorState error={active.error} onRetry={active.reload} />
        ) : !active.data ? (
          <SkeletonList rows={2} />
        ) : active.data.length === 0 ? (
          <Card>
            <EmptyState title={t('rider.none')} description={t('rider.noneHint')} />
          </Card>
        ) : (
          active.data.map((o) => <DeliveryCard key={o.id} order={o} busy={busyId === o.id} onPickedUp={() => advance(o, 'out_for_delivery')} onDelivered={() => setConfirming(o)} />)
        )}
      </section>

      <section aria-labelledby="today-heading">
        <Card className="p-4">
          <h2 id="today-heading" className="font-bold">
            {t('rider.today')}
          </h2>
          <p className="text-sm text-ink-soft">
            {t('rider.todayCount', { count: done.length })} · {t('rider.cashCollected', { amount: formatMoney(cash) })}
          </p>
          {done.length > 0 && (
            <ul className="mt-3 divide-y divide-line text-sm">
              {done.map((o) => (
                <li key={o.id} className="flex items-center gap-2 py-2">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                  <span className="font-semibold">{o.orderNumber}</span>
                  <span className="flex-1 truncate text-ink-soft">{o.address?.area}</span>
                  <span className="text-ink-soft">{formatTime(o.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(undefined)}
        title={confirming ? t('rider.confirmTitle', { number: confirming.orderNumber }) : ''}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setConfirming(undefined)}>
              {t('common.cancel')}
            </Button>
            <Button fullWidth loading={busyId === confirming?.id} onClick={() => confirming && advance(confirming, 'delivered')}>
              {t('rider.confirm')}
            </Button>
          </div>
        }
      >
        {confirming && <p>{needsCash(confirming) ? t('rider.confirmCash', { amount: formatMoney(confirming.pricing.total) }) : t('rider.confirmPrepaid')}</p>}
      </Modal>
    </div>
  )
}

const needsCash = (o: Order) => o.paymentMethod === 'cash' && o.paymentStatus !== 'paid'

function DeliveryCard({ order, busy, onPickedUp, onDelivered }: { order: Order; busy: boolean; onPickedUp: () => void; onDelivered: () => void }) {
  const { t } = useTranslation()
  const a = order.address
  const count = order.items.reduce((s, i) => s + i.quantity, 0)
  const directions = a ? `https://www.google.com/maps/dir/?api=1&destination=${a.coordinates.lat},${a.coordinates.lng}` : undefined
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <p className="text-lg font-extrabold">{order.orderNumber}</p>
        <OrderStatusBadge status={order.status} fulfillment={order.fulfillment} />
        <span className="ml-auto text-sm text-ink-soft">{t('rider.items', { count })}</span>
      </div>

      {needsCash(order) ? (
        <div className="flex items-center gap-2 rounded-xl bg-brand p-3 font-bold text-brand-fg">
          <Banknote className="h-5 w-5" aria-hidden="true" /> {t('rider.collectCash', { amount: formatMoney(order.pricing.total) })}
        </div>
      ) : (
        <Badge tone="success" className="self-start">
          {t('rider.prepaid')}
        </Badge>
      )}

      <div>
        <p className="font-bold">{order.customerName}</p>
        {a && (
          <p className="mt-1 flex gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {a.street}, {a.area}
              {a.instructions && <span className="block text-ink-soft">“{a.instructions}”</span>}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <a href={`tel:${order.customerPhone}`} aria-label={`${t('rider.call')} ${formatPhone(order.customerPhone)}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold hover:bg-muted">
          <Phone className="h-4 w-4" /> {t('rider.call')}
        </a>
        <a href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold hover:bg-muted">
          <MessageCircle className="h-4 w-4" /> {t('rider.whatsapp')}
        </a>
        {directions && (
          <a href={directions} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold hover:bg-muted">
            <Navigation className="h-4 w-4" /> {t('rider.navigate')}
          </a>
        )}
      </div>

      {order.status === 'ready' ? (
        <Button size="lg" fullWidth loading={busy} onClick={onPickedUp}>
          {t('rider.pickedUp')}
        </Button>
      ) : (
        <Button size="lg" fullWidth loading={busy} onClick={onDelivered}>
          {t('rider.delivered')}
        </Button>
      )}
    </Card>
  )
}
