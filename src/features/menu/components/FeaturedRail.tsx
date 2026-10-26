import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'
import type { MenuItem } from '@/types'

// Overlaid on the cards, centred vertically; an arrow disappears once there is nothing more that way.
const arrowClass =
  'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink shadow-lg ring-1 ring-black/10 transition-opacity hover:ring-ink disabled:pointer-events-none disabled:opacity-0'

/** Horizontally scrolling strip of popular and recommended items, with arrow buttons to page through it. */
export function FeaturedRail({ title, items, onOpen }: { title: string; items: MenuItem[]; onOpen: (item: MenuItem) => void }) {
  const { t } = useTranslation()
  const listRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  const updateEdges = useCallback(() => {
    const list = listRef.current
    const first = list?.firstElementChild
    const last = list?.lastElementChild
    if (!list || !first || !last) return
    // Compare card edges, not scroll offsets: snapping stops short of the true scroll end.
    const box = list.getBoundingClientRect()
    setEdges({ start: first.getBoundingClientRect().left >= box.left - 1, end: last.getBoundingClientRect().right <= box.right + 1 })
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges, items])

  const page = (direction: 1 | -1) => {
    const list = listRef.current
    if (!list) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Most of a screen at a time, so the last card in view stays visible for context.
    list.scrollBy({ left: direction * Math.max(list.clientWidth * 0.8, 180), behavior: reduce ? 'auto' : 'smooth' })
  }

  if (!items.length) return null
  return (
    <section aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="mb-3 text-lg font-extrabold">
        {title}
      </h2>
      <div className="relative">
        <ul ref={listRef} onScroll={updateEdges} className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
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
        {!(edges.start && edges.end) && (
          <>
            <button type="button" onClick={() => page(-1)} disabled={edges.start} aria-label={t('menu.scrollBack')} className={`${arrowClass} left-1`}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => page(1)} disabled={edges.end} aria-label={t('menu.scrollForward')} className={`${arrowClass} right-1`}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  )
}
