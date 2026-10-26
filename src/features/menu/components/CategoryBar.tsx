import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import type { MenuCategory } from '@/types'

export const sectionId = (categoryId: string) => `section-${categoryId}`

/**
 * Sticky chip bar that highlights the category in view (scroll spy) and jumps to a
 * section on tap. Sections need `scroll-mt-*` so they land below the sticky bars.
 */
export function CategoryBar({ categories }: { categories: MenuCategory[] }) {
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
      { rootMargin: '-140px 0px -55% 0px' },
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
      <div ref={barRef} className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-2.5">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#${sectionId(c.id)}`}
            data-category={c.id}
            aria-current={active === c.id ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault()
              jump(c.id)
            }}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
              active === c.id ? 'bg-brand text-brand-fg' : 'bg-muted text-ink-soft hover:text-ink',
            )}
          >
            {c.name}
          </a>
        ))}
      </div>
    </nav>
  )
}
