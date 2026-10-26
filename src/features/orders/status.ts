import type { TFunction } from 'i18next'
import { ACTIVE_STATUSES, flowFor } from '@/api/orders'
import type { FulfillmentType, Order, OrderStatus } from '@/types'

export { ACTIVE_STATUSES, flowFor }

export const isActive = (status: OrderStatus) => ACTIVE_STATUSES.includes(status)

/** "Delivered" reads oddly for pickup, so the final step is named per fulfilment. */
export function statusLabel(t: TFunction, status: OrderStatus, fulfillment: FulfillmentType): string {
  if (status === 'delivered' && fulfillment === 'pickup') return t('status.collected')
  if (status === 'ready' && fulfillment === 'pickup') return t('status.readyPickup')
  return t(`status.${status}`)
}

export type StatusTone = 'neutral' | 'dark' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

export function statusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case 'received':
      return 'warning'
    case 'accepted':
    case 'preparing':
      return 'info'
    case 'ready':
    case 'out_for_delivery':
      return 'dark'
    case 'delivered':
      return 'success'
    case 'rejected':
    case 'cancelled':
      return 'danger'
  }
}

/** When the customer should expect the order: scheduled time, or estimated ready + travel. */
export function expectedAt(order: Order): string | undefined {
  return order.scheduledFor ?? order.estimatedReadyAt
}
