import { useMemo } from 'react'
import { menuApi } from '@/api'
import { isWithinWindow } from '@/features/store/hours'
import { useAsync } from '@/lib/useAsync'
import type { MenuCategory, MenuItem } from '@/types'

export interface MenuData {
  categories: MenuCategory[]
  items: MenuItem[]
  itemsById: Map<string, MenuItem>
  categoriesById: Map<string, MenuCategory>
}

export function useMenu() {
  const state = useAsync(() => menuApi.getMenu(), [], 'menu')
  const data = useMemo<MenuData | undefined>(() => {
    if (!state.data) return undefined
    return {
      ...state.data,
      itemsById: new Map(state.data.items.map((i) => [i.id, i])),
      categoriesById: new Map(state.data.categories.map((c) => [c.id, c])),
    }
  }, [state.data])
  return { ...state, data }
}

/** Can this item be added to the cart right now? Sold out or outside its category's hours means no. */
export function orderability(item: MenuItem, category?: MenuCategory): { orderable: boolean; reason?: string } {
  if (!item.isAvailable) return { orderable: false, reason: 'Sold out' }
  if (category && !isWithinWindow(category.availableFrom, category.availableTo)) {
    return { orderable: false, reason: `Available ${category.availableFrom}–${category.availableTo}` }
  }
  return { orderable: true }
}
