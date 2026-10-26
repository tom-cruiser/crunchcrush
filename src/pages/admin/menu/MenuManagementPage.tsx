import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Clock, EyeOff, Pencil, Plus, Search, Trash2, UtensilsCrossed } from 'lucide-react'
import { menuApi } from '@/api'
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, Input, Modal, SkeletonList, Switch } from '@/components/ui'
import { CategoryEditor } from '@/features/admin/menu/CategoryEditor'
import { Can } from '@/features/auth/RequireStaff'
import { can } from '@/features/auth/permissions'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { invalidateCache, useAsync } from '@/lib/useAsync'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'
import type { MenuCategory, MenuItem } from '@/types'

export default function MenuManagementPage() {
  const navigate = useNavigate()
  const role = useAuth((s) => s.staff?.role)
  const canEdit = can(role, 'menu.edit')
  const menu = useAsync(() => menuApi.getAdminMenu(), [], 'admin-menu')
  const [params] = useSearchParams()
  const [categoryId, setCategoryId] = useState<string>(params.get('category') ?? 'all')
  const [query, setQuery] = useState('')
  const [editingCategory, setEditingCategory] = useState<MenuCategory | 'new'>()
  const [deleting, setDeleting] = useState<MenuItem>()
  const [busyId, setBusyId] = useState<string>()

  const categories = menu.data?.categories ?? []
  const items = menu.data?.items ?? []
  const counts = useMemo(() => new Map(categories.map((c) => [c.id, items.filter((i) => i.categoryId === c.id).length])), [categories, items])
  const visible = items.filter((i) => (categoryId === 'all' || i.categoryId === categoryId) && (!query.trim() || i.name.toLowerCase().includes(query.trim().toLowerCase())))
  const soldOut = items.filter((i) => !i.isAvailable).length

  /** Keep the customer menu cache fresh after any change. */
  const commit = (next: { categories: MenuCategory[]; items: MenuItem[] }) => {
    menu.setData(next)
    invalidateCache('menu')
  }

  const toggleAvailability = async (item: MenuItem, isAvailable: boolean) => {
    setBusyId(item.id)
    try {
      const updated = await menuApi.setItemAvailability(item.id, isAvailable)
      commit({ categories, items: items.map((i) => (i.id === updated.id ? updated : i)) })
      toast.show(`${item.name} ${isAvailable ? 'is back on' : 'marked sold out'}`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(undefined)
    }
  }

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const ids = categories.map((c) => c.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    try {
      commit({ categories: await menuApi.reorderCategories(ids), items })
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const deleteItem = async () => {
    if (!deleting) return
    try {
      await menuApi.deleteMenuItem(deleting.id)
      commit({ categories, items: items.filter((i) => i.id !== deleting.id) })
      toast.success(`${deleting.name} deleted`)
      setDeleting(undefined)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (menu.error && !menu.data) return <ErrorState error={menu.error} onRetry={menu.reload} />
  if (!menu.data) return <SkeletonList rows={6} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">Menu</h1>
        <Badge tone="outline">{items.length} items</Badge>
        {soldOut > 0 && <Badge tone="danger">{soldOut} sold out</Badge>}
        <Can permission="menu.edit">
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditingCategory('new')}>
              Category
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(`/admin/menu/items/new${categoryId !== 'all' ? `?category=${categoryId}` : ''}`)}>
              Item
            </Button>
          </div>
        </Can>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <nav aria-label="Categories" className="scrollbar-none flex gap-1 overflow-x-auto p-2 lg:flex-col">
            <button
              type="button"
              onClick={() => setCategoryId('all')}
              className={cn('flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold', categoryId === 'all' ? 'bg-brand text-brand-fg' : 'hover:bg-muted')}
            >
              All items <span className="text-xs opacity-70">{items.length}</span>
            </button>
            {categories.map((c, index) => (
              <div key={c.id} className={cn('group flex shrink-0 items-center gap-1 rounded-xl', categoryId === c.id ? 'bg-brand text-brand-fg' : 'hover:bg-muted')}>
                <button type="button" onClick={() => setCategoryId(c.id)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm font-semibold">
                  <span className="truncate">{c.name}</span>
                  {!c.isActive && <EyeOff className="h-3.5 w-3.5 shrink-0" aria-label="Hidden" />}
                  {c.availableFrom && <Clock className="h-3.5 w-3.5 shrink-0" aria-label={`Available ${c.availableFrom}–${c.availableTo}`} />}
                  <span className="ml-auto text-xs opacity-70">{counts.get(c.id)}</span>
                </button>
                {canEdit && (
                  <span className="hidden items-center pr-1 lg:flex">
                    <button type="button" aria-label={`Move ${c.name} up`} disabled={index === 0} onClick={() => moveCategory(index, -1)} className="rounded p-1 opacity-60 hover:opacity-100 disabled:opacity-20">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label={`Move ${c.name} down`} disabled={index === categories.length - 1} onClick={() => moveCategory(index, 1)} className="rounded p-1 opacity-60 hover:opacity-100 disabled:opacity-20">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label={`Edit ${c.name}`} onClick={() => setEditingCategory(c)} className="rounded p-1 opacity-60 hover:opacity-100">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            ))}
          </nav>
        </Card>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input aria-label="Search items" placeholder="Search items" leftIcon={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {canEdit && categoryId !== 'all' && (
              <Button variant="outline" className="h-12 lg:hidden" onClick={() => setEditingCategory(categories.find((c) => c.id === categoryId))} aria-label="Edit category">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={<UtensilsCrossed className="h-6 w-6" />}
                title="No items"
                description={query ? 'Try another search.' : 'Add the first item to this category.'}
                action={
                  canEdit && !query ? (
                    <ButtonLink to={`/admin/menu/items/new${categoryId !== 'all' ? `?category=${categoryId}` : ''}`}>Add item</ButtonLink>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-line">
                {visible.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-3">
                    <img src={item.imageUrl} alt="" width={56} height={56} loading="lazy" className={cn('h-14 w-14 shrink-0 rounded-lg bg-muted object-cover', !item.isAvailable && 'grayscale')} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-bold', !item.isAvailable && 'text-ink-soft')}>{item.name}</p>
                      <p className="text-sm">
                        {formatMoney(item.price)} <span className="text-ink-soft">· {item.prepTimeMinutes} min</span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {categoryId === 'all' && <Badge tone="outline">{categories.find((c) => c.id === item.categoryId)?.name}</Badge>}
                        {item.isPopular && <Badge tone="dark">Popular</Badge>}
                        {item.options.length > 0 && <Badge>{item.options.length} options</Badge>}
                        {item.addOns.length > 0 && <Badge>{item.addOns.length} add-ons</Badge>}
                      </div>
                    </div>
                    <Can permission="menu.availability">
                      <Switch
                        size="sm"
                        label={item.isAvailable ? 'Available' : 'Sold out'}
                        className="flex-col items-end gap-1 sm:flex-row sm:items-center"
                        checked={item.isAvailable}
                        disabled={busyId === item.id}
                        onChange={(on) => toggleAvailability(item, on)}
                      />
                    </Can>
                    <Can permission="menu.edit">
                      <div className="flex">
                        <Link to={`/admin/menu/items/${item.id}`} aria-label={`Edit ${item.name}`} className="rounded-full p-2 hover:bg-muted">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button type="button" aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)} className="rounded-full p-2 hover:bg-muted">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Can>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {editingCategory && (
        <CategoryEditor
          category={editingCategory === 'new' ? undefined : editingCategory}
          nextSortOrder={categories.length + 1}
          itemCount={editingCategory === 'new' ? 0 : (counts.get(editingCategory.id) ?? 0)}
          onClose={() => setEditingCategory(undefined)}
          onSaved={(c) => commit({ categories: categories.some((x) => x.id === c.id) ? categories.map((x) => (x.id === c.id ? c : x)) : [...categories, c], items })}
          onDeleted={(id) => {
            commit({ categories: categories.filter((c) => c.id !== id), items })
            setCategoryId('all')
          }}
        />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        title="Delete item"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={deleteItem}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft">Delete “{deleting?.name}” from the menu? To hide it temporarily, mark it sold out instead.</p>
      </Modal>
    </div>
  )
}
