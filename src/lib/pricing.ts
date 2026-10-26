import type { CartItem, FulfillmentType, Money, PriceBreakdown, PromoCode, RestaurantSettings } from '@/types'

export function lineTotal(item: Pick<CartItem, 'unitPrice' | 'quantity'>): Money {
  return item.unitPrice * item.quantity
}

export function cartSubtotal(items: CartItem[]): Money {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}

/** Returns the discount a promo gives on this subtotal, or 0 when it does not apply. */
export function promoDiscount(promo: PromoCode | undefined, subtotal: Money, deliveryFee: Money): Money {
  if (!promo || subtotal < promo.minOrder) return 0
  switch (promo.type) {
    case 'percentage': {
      const raw = Math.round((subtotal * promo.value) / 100)
      return promo.maxDiscount ? Math.min(raw, promo.maxDiscount) : raw
    }
    case 'fixed':
      return Math.min(promo.value, subtotal)
    case 'free_delivery':
      return deliveryFee
  }
}

interface PricingInput {
  items: CartItem[]
  fulfillment: FulfillmentType
  deliveryFee: Money
  settings: Pick<RestaurantSettings, 'taxRatePercent' | 'taxInclusive'>
  promo?: PromoCode
}

/**
 * The delivery fee applies to delivery only. When tax is inclusive the `tax` line
 * shows the VAT already contained in the total rather than adding to it.
 */
export function calculatePricing({ items, fulfillment, deliveryFee, settings, promo }: PricingInput): PriceBreakdown {
  const subtotal = cartSubtotal(items)
  const fee = fulfillment === 'delivery' ? deliveryFee : 0
  const discount = promoDiscount(promo, subtotal, fee)
  const taxable = subtotal - Math.min(discount, subtotal)
  const tax = settings.taxInclusive
    ? Math.round(taxable - taxable / (1 + settings.taxRatePercent / 100))
    : Math.round((taxable * settings.taxRatePercent) / 100)
  const total = subtotal + fee - discount + (settings.taxInclusive ? 0 : tax)
  return { subtotal, deliveryFee: fee, tax, discount, total: Math.max(0, total) }
}
