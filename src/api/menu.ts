import type { ID, MenuCategory, MenuItem } from '@/types'
import { http } from './http'

export interface MenuResponse {
  categories: MenuCategory[]
  items: MenuItem[]
}

const path = (base: string, id: ID) => `${base}/${encodeURIComponent(id)}`

/** GET /api/menu — active categories and all their items (sold-out included, flagged). */
export function getMenu(): Promise<MenuResponse> {
  return http('/menu')
}

/** GET /api/menu/items/:id */
export function getMenuItem(id: ID): Promise<MenuItem> {
  return http(path('/menu/items', id))
}

// ---- Admin ----

/** GET /api/admin/menu — every category, including hidden ones. */
export function getAdminMenu(): Promise<MenuResponse> {
  return http('/admin/menu')
}

/** PUT /api/admin/categories/:id (or POST when new) */
export function saveCategory(input: Omit<MenuCategory, 'id'> & { id?: ID }): Promise<MenuCategory> {
  return input.id ? http(path('/admin/categories', input.id), { method: 'PUT', body: input }) : http('/admin/categories', { method: 'POST', body: input })
}

/** DELETE /api/admin/categories/:id — refuses while items still belong to it. */
export function deleteCategory(id: ID): Promise<void> {
  return http(path('/admin/categories', id), { method: 'DELETE' })
}

/** PUT /api/admin/items/:id (or POST when new) */
export function saveMenuItem(input: Omit<MenuItem, 'id'> & { id?: ID }): Promise<MenuItem> {
  return input.id ? http(path('/admin/items', input.id), { method: 'PUT', body: input }) : http('/admin/items', { method: 'POST', body: input })
}

/** DELETE /api/admin/items/:id */
export function deleteMenuItem(id: ID): Promise<void> {
  return http(path('/admin/items', id), { method: 'DELETE' })
}

/** PATCH /api/admin/items/:id/availability */
export function setItemAvailability(id: ID, isAvailable: boolean): Promise<MenuItem> {
  return http(`${path('/admin/items', id)}/availability`, { method: 'PATCH', body: { isAvailable } })
}

/** PUT /api/admin/categories/order — saves a new category order. */
export function reorderCategories(orderedIds: ID[]): Promise<MenuCategory[]> {
  return http('/admin/categories/order', { method: 'PUT', body: orderedIds })
}

/** POST /api/admin/uploads — stores an item photo and returns its URL. */
export function uploadImage(file: Blob): Promise<{ url: string }> {
  const body = new FormData()
  body.append('file', file)
  return http('/admin/uploads', { method: 'POST', body })
}
