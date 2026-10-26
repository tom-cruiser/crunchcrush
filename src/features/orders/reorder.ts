import type { MenuData } from '@/features/menu/useMenu'
import { orderability } from '@/features/menu/useMenu'
import { initialSelection, invalidOptions, toCartItem } from '@/features/menu/customization'
import type { CartItem, Order } from '@/types'

export interface ReorderResult {
  lines: Omit<CartItem, 'lineId'>[]
  skipped: string[]
}

/**
 * Rebuilds an old order's lines against the current menu so prices are today's prices.
 * Lines whose item is gone, sold out or whose options no longer fit are skipped.
 */
export function buildReorder(order: Order, menu: MenuData): ReorderResult {
  const lines: Omit<CartItem, 'lineId'>[] = []
  const skipped: string[] = []
  for (const old of order.items) {
    const item = menu.itemsById.get(old.itemId)
    if (!item || !orderability(item, menu.categoriesById.get(item.categoryId)).orderable) {
      skipped.push(old.name)
      continue
    }
    const selection = initialSelection(item, old as CartItem)
    // Drop add-ons and choices that no longer exist or are sold out.
    selection.addOns = Object.fromEntries(Object.entries(selection.addOns).filter(([id]) => item.addOns.some((a) => a.id === id && a.isAvailable)))
    for (const option of item.options) {
      selection.options[option.id] = (selection.options[option.id] ?? []).filter((id) => option.choices.some((c) => c.id === id && c.isAvailable))
    }
    if (invalidOptions(item, selection).length) {
      skipped.push(old.name)
      continue
    }
    lines.push(toCartItem(item, selection))
  }
  return { lines, skipped }
}
