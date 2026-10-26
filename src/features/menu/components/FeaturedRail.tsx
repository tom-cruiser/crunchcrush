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
          <li key={item.id} className="w-44 shrink-0 snap-start sm:w-52">
            <button type="button" onClick={() => onOpen(item)} className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-brand text-left text-brand-fg shadow-sm">
              <span className="relative block overflow-hidden">
                <img src={item.imageUrl} alt="" loading="lazy" decoding="async" width={208} height={156} className="aspect-[4/3] w-full bg-ink-soft object-cover transition-transform group-hover:scale-[1.04]" />
                <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-semibold text-ink">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {t('menu.prepTime', { count: item.prepTimeMinutes })}
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-0.5 p-3">
                <span className="line-clamp-1 text-sm font-bold">{item.name}</span>
                <span className="line-clamp-1 text-xs text-white/60">{item.description}</span>
                <span className="mt-auto pt-2 text-base font-extrabold tabular-nums">{formatMoney(item.price)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
