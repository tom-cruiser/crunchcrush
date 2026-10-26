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
      <header className="flex flex-col gap-3">
        <img src={settings.coverUrl} alt="" width={1200} height={400} fetchPriority="high" decoding="async" className="aspect-[3/1] w-full rounded-card bg-muted object-cover" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold">{settings.name}</h1>
            <p className="text-sm text-ink-soft">{settings.tagline}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {status.open ? `${t('store.open')} · ${status.todayHours}` : status.holidayReason ? `${t('store.closed')} · ${status.holidayReason}` : t('store.closed')}
            </p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Info className="h-4 w-4" />} onClick={() => setInfoOpen(true)}>
            {t('menu.info')}
          </Button>
        </div>
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
      </header>

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
            className="pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.query && (
            <button type="button" aria-label="Clear search" onClick={() => setFilters({ ...filters, query: '' })} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-ink-soft hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant={filterCount ? 'primary' : 'outline'} className="h-12" onClick={() => setFiltersOpen(true)} aria-label={`${t('menu.filters')}${filterCount ? ` (${filterCount})` : ''}`}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('menu.filters')}</span>
          {filterCount > 0 && <span className="rounded-full bg-surface px-1.5 text-xs text-ink">{filterCount}</span>}
        </Button>
      </div>

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
            <CategoryBar categories={sections.map((s) => s.category)} />
            <div className="flex flex-col gap-8 pt-5">
              {sections.map(({ category, items }) => {
                const inWindow = isWithinWindow(category.availableFrom, category.availableTo)
                return (
                  <section key={category.id} id={sectionId(category.id)} aria-labelledby={`${sectionId(category.id)}-h`} className="scroll-mt-32">
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
