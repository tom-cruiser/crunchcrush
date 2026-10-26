import { useParams } from 'react-router-dom'
import { CheckCircle2, ClipboardX, MapPin, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, ordersApi } from '@/api'
import { Badge, ButtonLink, Card, CardBody, EmptyState, ErrorState, SkeletonList } from '@/components/ui'
import { PriceSummary } from '@/features/cart/components/PriceSummary'
import { describeCustomization } from '@/features/menu/customization'
import { PushPrompt } from '@/features/notifications/PushPrompt'
import { useSettings } from '@/features/store/useSettings'
import { formatDateTime, formatMoney, formatTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

export default function OrderConfirmedPage() {
  const { t } = useTranslation()
  const { orderId = '' } = useParams()
  const order = useAsync(() => ordersApi.getOrder(orderId), [orderId])
  const { data: settings } = useSettings()

  if (order.error) {
    if (order.error instanceof ApiError && order.error.code === 'not_found') {
      return <EmptyState icon={<ClipboardX className="h-6 w-6" />} title={t('confirm.notFound')} action={<ButtonLink to="/">{t('confirm.backToMenu')}</ButtonLink>} />
    }
    return <ErrorState error={order.error} onRetry={order.reload} />
  }
  if (!order.data || !settings) return <SkeletonList rows={3} />

  const o = order.data
  const etaIso = o.scheduledFor ?? o.estimatedReadyAt
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-2">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="h-14 w-14" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold">{t('confirm.title')}</h1>
        <p className="text-ink-soft">{t('confirm.subtitle', { name: o.customerName.split(' ')[0] })}</p>
      </div>

      <Card>
        <CardBody className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold text-ink-soft">{t('confirm.number')}</p>
          <p className="text-4xl font-extrabold tracking-wider">{o.orderNumber}</p>
          {etaIso && (
            <p className="mt-1 font-semibold">
              {o.scheduledFor
                ? t('confirm.scheduled', { time: formatDateTime(o.scheduledFor) })
                : o.fulfillment === 'delivery'
                  ? t('confirm.etaDelivery', { time: formatTime(etaIso) })
                  : t('confirm.eta', { time: formatTime(etaIso) })}
            </p>
          )}
          <div className="mt-2">
            {o.paymentStatus === 'paid' ? (
              <Badge tone="success">{t('confirm.paid', { method: t(`payment.${o.paymentMethod}`) })}</Badge>
            ) : o.paymentMethod === 'cash' ? (
              <Badge tone="outline">{t('confirm.cash', { amount: formatMoney(o.pricing.total) })}</Badge>
            ) : (
              <Badge tone="warning">{t('confirm.unpaid')}</Badge>
            )}
          </div>
        </CardBody>
      </Card>

      <PushPrompt />

      <Card>
        <CardBody className="flex flex-col gap-4 text-sm">
          <p className="flex items-start gap-2">
            {o.fulfillment === 'delivery' ? <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> : <Store className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              <span className="font-semibold">{t(`fulfillment.${o.fulfillment}`)}</span>
              {o.fulfillment === 'delivery' && o.address && <span className="block text-ink-soft">{`${o.address.street}, ${o.address.area}`}</span>}
              {o.fulfillment === 'pickup' && <span className="block text-ink-soft">{`${settings.address.street}, ${settings.address.area}`}</span>}
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
                </span>
                <span className="tabular-nums">{formatMoney(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-3">
            <PriceSummary pricing={o.pricing} settings={settings} promo={o.promoCode ? { code: o.promoCode, type: o.pricing.deliveryFee > 0 && o.pricing.discount === o.pricing.deliveryFee ? 'free_delivery' : 'fixed' } : undefined} showDelivery={o.fulfillment === 'delivery'} />
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-2">
        <ButtonLink to={`/order/${o.id}`} size="lg" fullWidth>
            {t('confirm.track')}
          </ButtonLink>
        <ButtonLink to="/" size="lg" variant="ghost" fullWidth>
            {t('confirm.backToMenu')}
          </ButtonLink>
      </div>
    </div>
  )
}
