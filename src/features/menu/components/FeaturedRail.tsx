import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'
import type { MenuItem } from '@/types'

/** Horizontally scrolling strip of popular and recommended items. */
export function FeaturedRail({ title, items, onOpen }: { title: string; items: MenuItem[]; onOpen: (item: MenuItem) => void }) {
  const { t } = useTranslation()
  if (!items.length) return null
  return (
    <section aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="mb-3 text-lg font-extrabold">
        {title}
      </h2>
      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {items.map((item) => (
          <li key={item.id} className="w-40 shrink-0 snap-start sm:w-48">
            <button type="button" onClick={() => onOpen(item)} className="group flex w-full flex-col gap-2 text-left">
              <img src={item.imageUrl} alt="" loading="lazy" decoding="async" width={192} height={144} className="aspect-[4/3] w-full rounded-xl bg-muted object-cover transition-transform group-hover:scale-[1.02]" />
              <span className="line-clamp-1 text-sm font-bold">{item.name}</span>
              <span className="-mt-1.5 flex items-center gap-2 text-sm text-ink-soft">
                <span className="font-semibold text-ink">{formatMoney(item.price)}</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {t('menu.prepTime', { count: item.prepTimeMinutes })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
