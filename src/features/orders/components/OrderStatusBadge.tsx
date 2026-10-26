import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { FulfillmentType, OrderStatus } from '@/types'
import { statusLabel, statusTone } from '../status'

export function OrderStatusBadge({ status, fulfillment, className }: { status: OrderStatus; fulfillment: FulfillmentType; className?: string }) {
  const { t } = useTranslation()
  return (
    <Badge tone={statusTone(status)} className={className}>
      {statusLabel(t, status, fulfillment)}
    </Badge>
  )
}
