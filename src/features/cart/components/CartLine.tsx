import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { QuantityStepper } from '@/components/ui'
import { describeCustomization } from '@/features/menu/customization'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { lineTotal } from '@/lib/pricing'
import type { CartItem } from '@/types'

interface CartLineProps {
  line: CartItem
  unavailableReason?: string
  onQuantity: (quantity: number) => void
  onEdit?: () => void
  onRemove: () => void
}

export function CartLine({ line, unavailableReason, onQuantity, onEdit, onRemove }: CartLineProps) {
  const { t } = useTranslation()
  const details = describeCustomization(line)
  return (
    <li className="flex gap-3 py-4">
      <img src={line.imageUrl} alt="" width={64} height={64} loading="lazy" className={cn('h-16 w-16 shrink-0 rounded-xl bg-muted object-cover', unavailableReason && 'grayscale')} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="leading-snug font-bold">{line.name}</h2>
          <span className="font-bold whitespace-nowrap tabular-nums">{formatMoney(lineTotal(line))}</span>
        </div>
        {details && <p className="text-sm text-ink-soft">{details}</p>}
        {line.note && <p className="text-sm text-ink-soft italic">“{line.note}”</p>}
        {unavailableReason && (
          <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {unavailableReason}: {t('cart.unavailable')}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3">
          <QuantityStepper size="sm" value={line.quantity} min={1} max={20} removable onChange={(q) => (q < 1 ? onRemove() : onQuantity(q))} label={`${t('menu.quantity')}: ${line.name}`} />
          {onEdit && !unavailableReason && (
            <button type="button" onClick={onEdit} className="text-sm font-semibold underline underline-offset-2">
              {t('cart.edit')}
            </button>
          )}
          <button type="button" onClick={onRemove} className="text-sm font-semibold text-ink-soft underline underline-offset-2">
            {t('cart.remove')}
          </button>
        </div>
      </div>
    </li>
  )
}
