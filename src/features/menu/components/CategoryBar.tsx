import { useEffect, useRef, useState } from 'react'
import { CupSoda, EggFried, IceCreamCone, Package, Popcorn, Sandwich, SlidersHorizontal, Sunrise, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { MenuCategory } from '@/types'

export const sectionId = (categoryId: string) => `section-${categoryId}`

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

/**
 * Sticky chip bar that highlights the category in view (scroll spy) and jumps to a
 * section on tap. Sections need `scroll-mt-*` so they land below the sticky bars.
 * A Filters chip leads the bar so filters stay reachable while scrolling.
 */
export function CategoryBar({ categories, filterCount, onOpenFilters }: { categories: MenuCategory[]; filterCount: number; onOpenFilters: () => void }) {
  const { t } = useTranslation()
  const [active, setActive] = useState(categories[0]?.id)
  const barRef = useRef<HTMLDivElement>(null)
  const lockUntil = useRef(0)

  useEffect(() => {
    const sections = categories.map((c) => document.getElementById(sectionId(c.id))).filter((el): el is HTMLElement => Boolean(el))
    if (!sections.length) return
    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting)
        if (Date.now() < lockUntil.current) return
        // First section (in menu order) whose top band is on screen.
        const first = categories.find((c) => visible.get(sectionId(c.id)))
        if (first) setActive(first.id)
      },
      { rootMargin: '-150px 0px -55% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [categories])

  // Keep the active chip visible inside the horizontally scrolling bar.
  useEffect(() => {
    const chip = barRef.current?.querySelector<HTMLElement>(`[data-category="${active}"]`)
    const bar = barRef.current
    if (chip && bar) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  const jump = (id: string) => {
    setActive(id)
    lockUntil.current = Date.now() + 800
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(sectionId(id))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav aria-label="Menu categories" className="sticky top-16 z-20 -mx-4 border-b border-line bg-surface/95 backdrop-blur">
      <div ref={barRef} className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 py-3">
        <button type="button" onClick={onOpenFilters} className={cn(chipClass, filterCount ? 'border-ink' : 'border-line hover:border-ink')}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t('menu.filters')}
          {filterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs text-brand-fg">{filterCount}</span>}
        </button>
        <span className="mx-1 h-7 w-px shrink-0 bg-line" aria-hidden="true" />
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.id] ?? UtensilsCrossed
          return (
            <a
              key={c.id}
              href={`#${sectionId(c.id)}`}
              data-category={c.id}
              aria-current={active === c.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault()
                jump(c.id)
              }}
              className={cn(chipClass, active === c.id ? 'border-ink text-ink ring-1 ring-ink' : 'border-line text-ink-soft hover:border-ink hover:text-ink')}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {c.name}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
