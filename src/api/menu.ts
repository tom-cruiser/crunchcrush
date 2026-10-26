import type { ID, MenuCategory, MenuItem } from '@/types'
import { uid } from '@/lib/id'
import { mock, notFound } from './client'
import { db } from './mock/db'

export interface MenuResponse {
  categories: MenuCategory[]
  items: MenuItem[]
}

const byOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder

/** GET /api/menu — active categories and all their items (sold-out included, flagged). */
export function getMenu(): Promise<MenuResponse> {
  return mock(() => {
    const categories = db.categories.filter((c) => c.isActive).sort(byOrder)
    const ids = new Set(categories.map((c) => c.id))
    return { categories, items: db.items.filter((i) => ids.has(i.categoryId)).sort(byOrder) }
  })
}

/** GET /api/menu/items/:id */
export function getMenuItem(id: ID): Promise<MenuItem> {
  return mock(() => db.items.find((i) => i.id === id) ?? notFound('Menu item'))
}

// ---- Admin ----

/** GET /api/admin/menu — every category, including hidden ones. */
export function getAdminMenu(): Promise<MenuResponse> {
  return mock(() => ({ categories: [...db.categories].sort(byOrder), items: [...db.items].sort(byOrder) }))
}

/** PUT /api/admin/categories/:id (or POST when new) */
export function saveCategory(input: Omit<MenuCategory, 'id'> & { id?: ID }): Promise<MenuCategory> {
  return mock(
    () => {
      const category: MenuCategory = { ...input, id: input.id ?? uid('cat') }
      const index = db.categories.findIndex((c) => c.id === category.id)
      if (index >= 0) db.categories[index] = category
      else db.categories.push(category)
      return category
    },
    { write: true },
  )
}

/** DELETE /api/admin/categories/:id — refuses while items still belong to it. */
export function deleteCategory(id: ID): Promise<void> {
  return mock(
    () => {
      if (db.items.some((i) => i.categoryId === id)) throw new Error('Move or delete the items in this category first.')
      db.categories = db.categories.filter((c) => c.id !== id)
    },
    { write: true },
  )
}

/** PUT /api/admin/items/:id (or POST when new) */
export function saveMenuItem(input: Omit<MenuItem, 'id'> & { id?: ID }): Promise<MenuItem> {
  return mock(
    () => {
      const item: MenuItem = { ...input, id: input.id ?? uid('item') }
      const index = db.items.findIndex((i) => i.id === item.id)
      if (index >= 0) db.items[index] = item
      else db.items.push(item)
      return item
    },
    { write: true },
  )
}

/** DELETE /api/admin/items/:id */
export function deleteMenuItem(id: ID): Promise<void> {
  return mock(
    () => {
      db.items = db.items.filter((i) => i.id !== id)
    },
    { write: true },
  )
}

/** PATCH /api/admin/items/:id/availability */
export function setItemAvailability(id: ID, isAvailable: boolean): Promise<MenuItem> {
  return mock(
    () => {
      const item = db.items.find((i) => i.id === id) ?? notFound('Menu item')
      item.isAvailable = isAvailable
      return item
    },
    { write: true, minDelay: 100, maxDelay: 250 },
  )
}

/** PUT /api/admin/categories/order — saves a new category order. */
export function reorderCategories(orderedIds: ID[]): Promise<MenuCategory[]> {
  return mock(
    () => {
      orderedIds.forEach((id, i) => {
        const c = db.categories.find((x) => x.id === id)
        if (c) c.sortOrder = i + 1
      })
      return [...db.categories].sort(byOrder)
    },
    { write: true, minDelay: 100, maxDelay: 250 },
  )
}
