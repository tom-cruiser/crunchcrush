import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import type { PriceBreakdown, PromoCode, RestaurantSettings } from '@/types'

interface PriceSummaryProps {
  pricing: PriceBreakdown
  settings: Pick<RestaurantSettings, 'taxRatePercent' | 'taxInclusive' | 'serviceChargePercent'>
  promo?: Pick<PromoCode, 'code' | 'type'>
  /** Delivery fee not known yet (no address): show "calculated at checkout". */
  deliveryPending?: boolean
  showDelivery?: boolean
  className?: string
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-3', strong && 'mt-1 border-t border-line pt-3 text-base font-extrabold', muted && 'text-ink-soft')}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

export function PriceSummary({ pricing, settings, promo, deliveryPending, showDelivery = true, className }: PriceSummaryProps) {
  const { t } = useTranslation()
  return (
    <div className={cn('text-sm', className)}>
      <dl className="flex flex-col gap-2">
        <Row label={t('cart.subtotal')} value={formatMoney(pricing.subtotal)} />
        {showDelivery && (
          <Row
            label={t('cart.deliveryFee')}
            value={deliveryPending ? t('cart.deliveryAtCheckout') : promo?.type === 'free_delivery' && pricing.discount > 0 ? t('cart.freeDelivery') : formatMoney(pricing.deliveryFee)}
            muted={deliveryPending}
          />
        )}
        {pricing.serviceCharge > 0 && <Row label={t('cart.serviceCharge', { percent: settings.serviceChargePercent })} value={formatMoney(pricing.serviceCharge)} />}
        {pricing.discount > 0 && promo?.type !== 'free_delivery' && <Row label={`${t('cart.discount')}${promo ? ` (${promo.code})` : ''}`} value={`−${formatMoney(pricing.discount)}`} />}
        {!settings.taxInclusive && pricing.tax > 0 && <Row label={t('cart.tax', { percent: settings.taxRatePercent })} value={formatMoney(pricing.tax)} />}
        <Row label={t('cart.total')} value={formatMoney(pricing.total)} strong />
      </dl>
      {settings.taxInclusive && pricing.tax > 0 && <p className="text-right text-xs text-ink-soft">{t('cart.taxIncluded', { percent: settings.taxRatePercent })}: {formatMoney(pricing.tax)}</p>}
    </div>
  )
}
