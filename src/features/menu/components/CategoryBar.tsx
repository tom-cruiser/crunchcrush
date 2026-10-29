import { useEffect, useRef } from 'react'
import { CupSoda, EggFried, IceCreamCone, LayoutGrid, Package, Popcorn, Sandwich, SlidersHorizontal, Sunrise, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { ID, MenuCategory } from '@/types'

export const sectionId = (categoryId: string) => `section-${categoryId}`

/** Shown when no single category is chosen. */
export const ALL_CATEGORIES = 'all'

/** Icons for the built-in categories; categories added later in admin get the generic one. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'cat-tacos': Sandwich,
  'cat-rolex': EggFried,
  'cat-breakfast': Sunrise,
  'cat-combos': Package,
  'cat-sides': Popcorn,
  'cat-drinks': CupSoda,
  'cat-desserts': IceCreamCone,
}

const chipClass = 'flex h-11 shrink-0 items-center gap-2 rounded-full border bg-surface px-4 text-sm font-semibold whitespace-nowrap transition-colors'

interface CategoryBarProps {
  categories: MenuCategory[]
  /** A category id, or ALL_CATEGORIES. */
  selected: ID
  onSelect: (id: ID) => void
  filterCount: number
  onOpenFilters: () => void
}

/**
 * Sticky chip bar that filters the menu below it: "All" shows every category, any
 * other chip shows only that one. A Filters chip leads the bar so filters stay
 * reachable while scrolling.
 */
export function CategoryBar({ categories, selected, onSelect, filterCount, onOpenFilters }: CategoryBarProps) {
  const { t } = useTranslation()
  const barRef = useRef<HTMLDivElement>(null)

  // Keep the selected chip visible inside the horizontally scrolling bar.
  useEffect(() => {
    const bar = barRef.current
    const chip = bar?.querySelector<HTMLElement>(`[data-category="${selected}"]`)
    if (chip && bar) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [selected])

  const chips = [{ id: ALL_CATEGORIES, name: t('menu.allCategories'), Icon: LayoutGrid }, ...categories.map((c) => ({ id: c.id, name: c.name, Icon: CATEGORY_ICONS[c.id] ?? UtensilsCrossed }))]

  return (
    <nav aria-label="Menu categories" className="sticky top-16 z-20 -mx-4 border-b border-line bg-surface/95 backdrop-blur">
      <div ref={barRef} className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 py-3">
        <button type="button" onClick={onOpenFilters} className={cn(chipClass, filterCount ? 'border-ink' : 'border-line hover:border-ink')}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t('menu.filters')}
          {filterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs text-brand-fg">{filterCount}</span>}
        </button>
        <span className="mx-1 h-7 w-px shrink-0 bg-line" aria-hidden="true" />
        {chips.map(({ id, name, Icon }) => (
          <button
            key={id}
            type="button"
            data-category={id}
            aria-pressed={selected === id}
            onClick={() => onSelect(id)}
            className={cn(chipClass, selected === id ? 'border-ink text-ink ring-1 ring-ink' : 'border-line text-ink-soft hover:border-ink hover:text-ink')}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {name}
          </button>
        ))}
      </div>
    </nav>
  )
}
