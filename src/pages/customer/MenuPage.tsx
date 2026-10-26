import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Clock, Info, SearchX, SlidersHorizontal, Search, UtensilsCrossed, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, ErrorState, Input, Skeleton, SkeletonList } from '@/components/ui'
import { CartBar } from '@/features/menu/components/CartBar'
import { CategoryBar, sectionId } from '@/features/menu/components/CategoryBar'
import { FeaturedRail } from '@/features/menu/components/FeaturedRail'
import { FilterSheet } from '@/features/menu/components/FilterSheet'
import { ItemSheet } from '@/features/menu/components/ItemSheet'
import { MenuItemCard } from '@/features/menu/components/MenuItemCard'
import { RestaurantInfoSheet } from '@/features/menu/components/RestaurantInfoSheet'
import { InstallPrompt } from '@/features/pwa/InstallPrompt'
import { activeFilterCount, EMPTY_FILTERS, matchesFilters, type MenuFilters } from '@/features/menu/filters'
import { orderability, useMenu } from '@/features/menu/useMenu'
import { getOpenStatus, isWithinWindow } from '@/features/store/hours'
import { useSettings } from '@/features/store/useSettings'
import { toast } from '@/store/toast'
import type { MenuItem } from '@/types'

function MenuSkeleton() {
  return (
    <div role="status" aria-label="Loading menu" className="flex flex-col gap-4">
      <Skeleton className="aspect-[3/1] w-full rounded-card" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-[4/3] w-40 shrink-0 rounded-xl" />
        ))}
      </div>
      <SkeletonList rows={4} />
    </div>
  )
}

export default function MenuPage() {
  const { t } = useTranslation()
  const menu = useMenu()
  const { data: settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState<MenuFilters>(EMPTY_FILTERS)
  const deferredFilters = useDeferredValue(filters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const openItemId = params.get('item')
  const openItem = openItemId ? menu.data?.itemsById.get(openItemId) : undefined

  const openItemSheet = (item: MenuItem) =>
    setParams((p) => {
      const next = new URLSearchParams(p)
      next.set('item', item.id)
      return next
    })
  const closeItemSheet = () =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        next.delete('item')
        return next
      },
      { replace: true },
    )

  // A shared link to an item that has since been removed from the menu.
  const missingItem = Boolean(openItemId && menu.data && !openItem)
  useEffect(() => {
    if (missingItem) {
      toast.error(t('menu.itemNotFound'))
      closeItemSheet()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingItem])

  const searching = deferredFilters.query.trim() !== '' || activeFilterCount(deferredFilters) > 0
  const results = useMemo(() => menu.data?.items.filter((i) => matchesFilters(i, deferredFilters)) ?? [], [menu.data, deferredFilters])

  const featured = useMemo(() => {
    if (!menu.data) return []
    return menu.data.items.filter((i) => (i.isPopular || i.isRecommended) && orderability(i, menu.data?.categoriesById.get(i.categoryId)).orderable)
  }, [menu.data])

  const sections = useMemo(
    () => menu.data?.categories.map((c) => ({ category: c, items: menu.data!.items.filter((i) => i.categoryId === c.id) })).filter((s) => s.items.length > 0) ?? [],
    [menu.data],
  )

  if (menu.error && !menu.data) return <ErrorState error={menu.error} onRetry={menu.reload} />
  if (!menu.data || !settings) return <MenuSkeleton />

  const status = getOpenStatus(settings)
  const reasonFor = (item: MenuItem) => orderability(item, menu.data?.categoriesById.get(item.categoryId)).reason
  const filterCount = activeFilterCount(filters)

  return (
    <div className="flex flex-col gap-5">
      <header className="relative -mx-4 -mt-4 overflow-hidden bg-brand px-5 pt-6 pb-14 text-brand-fg md:mx-0 md:mt-0 md:rounded-card md:px-10 md:pt-10 md:pb-12">
        <img src={settings.coverUrl} alt="" width={1200} height={800} fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover object-right opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand via-brand/80 to-brand/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 md:max-w-lg">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">{t('menu.heroKicker')}</p>
            <button type="button" onClick={() => setInfoOpen(true)} aria-label={t('menu.info')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-lg">
              <Info className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="-mt-4">
            <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-tight md:text-6xl">
              {settings.name.split(' ')[0]}{' '}
              <span className="block italic font-normal">{settings.name.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="mt-3 max-w-60 text-sm text-white/75">{settings.tagline}</p>
          </div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className={`h-2 w-2 rounded-full ${status.open ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden="true" />
            <Clock className="h-4 w-4 text-white/70" aria-hidden="true" />
            {status.open ? `${t('store.open')} · ${status.todayHours}` : status.holidayReason ? `${t('store.closed')} · ${status.holidayReason}` : t('store.closed')}
          </p>
          <div role="search" className="flex gap-2">
            <div className="relative flex-1">
              <Input
                aria-label={t('common.search')}
                type="search"
                enterKeyHint="search"
                placeholder={t('menu.searchPlaceholder')}
                leftIcon={<Search className="h-4 w-4" />}
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="rounded-full border-0 pr-10 text-ink [&::-webkit-search-cancel-button]:hidden"
              />
              {filters.query && (
                <button type="button" aria-label="Clear search" onClick={() => setFilters({ ...filters, query: '' })} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-ink-soft hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label={`${t('menu.filters')}${filterCount ? ` (${filterCount})` : ''}`}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {filterCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1 text-xs font-bold text-ink ring-2 ring-brand">{filterCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className="relative -mx-4 -mt-12 flex flex-col gap-5 rounded-t-[1.75rem] bg-surface px-4 pt-6 md:mx-0 md:mt-0 md:rounded-none md:px-0 md:pt-2">
        {!status.open && (
          <p role="status" className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t('menu.closedBanner')}
          </p>
        )}
        {status.open && settings.busyMode && (
          <p role="status" className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t('menu.busyBanner', { count: settings.busyExtraMinutes })}
          </p>
        )}
        <h2 className="text-3xl font-extrabold tracking-tight">{t('nav.menu')}</h2>

        {menu.data.items.length === 0 ? (
          <EmptyState icon={<UtensilsCrossed className="h-6 w-6" />} title={t('menu.emptyMenu')} description={t('menu.emptyMenuBody')} />
        ) : searching ? (
          <section aria-live="polite" aria-label="Search results">
            <p className="mb-3 text-sm font-semibold text-ink-soft">{t('menu.results', { count: results.length })}</p>
            {results.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-6 w-6" />}
                title={t('menu.noResults')}
                description={t('menu.noResultsBody')}
                action={
                  <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                    {t('menu.clearFilters')}
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {results.map((item) => (
                  <li key={item.id}>
                    <MenuItemCard item={item} unavailableReason={reasonFor(item)} onOpen={openItemSheet} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
            <InstallPrompt />
            <FeaturedRail title={t('menu.popularRail')} items={featured} onOpen={openItemSheet} />
            <div>
              <CategoryBar categories={sections.map((s) => s.category)} filterCount={filterCount} onOpenFilters={() => setFiltersOpen(true)} />
              <div className="flex flex-col gap-8 pt-5">
                {sections.map(({ category, items }) => {
                  const inWindow = isWithinWindow(category.availableFrom, category.availableTo)
                  return (
                    <section key={category.id} id={sectionId(category.id)} aria-labelledby={`${sectionId(category.id)}-h`} className="scroll-mt-36">
                      <h2 id={`${sectionId(category.id)}-h`} className="text-xl font-extrabold">
                        {category.name}
                      </h2>
                      {category.description && <p className="text-sm text-ink-soft">{category.description}</p>}
                      {!inWindow && (
                        <p className="mt-1 text-sm font-semibold">
                          Available {category.availableFrom}–{category.availableTo}
                        </p>
                      )}
                      <ul className="mt-3 grid gap-3 md:grid-cols-2">
                        {items.map((item) => (
                          <li key={item.id}>
                            <MenuItemCard item={item} unavailableReason={reasonFor(item)} onOpen={openItemSheet} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="mt-4 border-t border-line pt-4 text-center text-xs text-ink-soft">
        <Link to="/admin" className="underline underline-offset-2">
          Staff login
        </Link>
      </footer>

      <CartBar />
      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} onChange={setFilters} resultCount={menu.data.items.filter((i) => matchesFilters(i, filters)).length} />
      <RestaurantInfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} settings={settings} />
      <ItemSheet item={openItem} category={openItem ? menu.data.categoriesById.get(openItem.categoryId) : undefined} onClose={closeItemSheet} />
    </div>
  )
}
