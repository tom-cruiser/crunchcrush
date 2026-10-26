import { Clock, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import type { MenuItem } from '@/types'
import { DietaryBadges } from './DietaryBadges'

interface MenuItemCardProps {
  item: MenuItem
  unavailableReason?: string
  onOpen: (item: MenuItem) => void
}

/** Row card: text on the left, photo on the right. The whole card is one button. */
export function MenuItemCard({ item, unavailableReason, onOpen }: MenuItemCardProps) {
  const { t } = useTranslation()
  const unavailable = Boolean(unavailableReason)
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`${item.name}, ${formatMoney(item.price)}${unavailableReason ? `, ${unavailableReason}` : ''}`}
      className={cn('group flex w-full gap-3 rounded-card border border-line bg-surface p-3 text-left transition-shadow hover:shadow-md', unavailable && 'bg-muted/60')}
    >
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1.5', unavailable && 'text-ink-soft')}>
        <div className="flex flex-wrap items-center gap-1.5">
          {item.isPopular && <Badge tone="dark">{t('menu.popular')}</Badge>}
          {item.isRecommended && <Badge tone="outline">{t('menu.recommended')}</Badge>}
        </div>
        <h3 className="leading-snug font-bold">{item.name}</h3>
        <p className="line-clamp-2 text-sm text-ink-soft">{item.description}</p>
        <DietaryBadges tags={item.dietaryTags} max={3} />
        <div className="mt-auto flex items-center gap-3 pt-1 text-sm">
          <span className="font-bold">{formatMoney(item.price)}</span>
          <span className="flex items-center gap-1 text-ink-soft">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t('menu.prepTime', { count: item.prepTimeMinutes })}
          </span>
        </div>
      </div>
      <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          width={128}
          height={128}
          className={cn('h-full w-full rounded-xl bg-muted object-cover', unavailable && 'grayscale')}
        />
        {unavailable ? (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-surface/95 px-1.5 py-1 text-center text-[11px] leading-tight font-bold">{unavailableReason}</span>
        ) : (
          <span aria-hidden="true" className="absolute right-1.5 bottom-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink shadow-md transition-transform group-hover:scale-110">
            <Plus className="h-5 w-5" />
          </span>
        )}
      </div>
    </button>
  )
}
