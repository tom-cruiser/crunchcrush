import { orderability, useMenu } from '@/features/menu/useMenu'
import type { CartItem } from '@/types'

/**
 * Checks cart lines against the live menu: items can sell out or leave the menu
 * after they were added. Returns a reason per unavailable line id.
 */
export function useCartValidation(items: CartItem[]) {
  const menu = useMenu()
  const problems = new Map<string, string>()
  if (menu.data) {
    for (const line of items) {
      const item = menu.data.itemsById.get(line.itemId)
      if (!item) {
        problems.set(line.lineId, 'Removed from menu')
        continue
      }
      const { orderable, reason } = orderability(item, menu.data.categoriesById.get(item.categoryId))
      if (!orderable) problems.set(line.lineId, reason ?? 'Unavailable')
      // A chosen option may have sold out too.
      const soldOutChoice = line.selectedOptions.some((o) => o.choiceIds.some((id) => item.options.find((op) => op.id === o.optionId)?.choices.find((c) => c.id === id)?.isAvailable === false))
      if (orderable && soldOutChoice) problems.set(line.lineId, 'An option you chose is sold out')
    }
  }
  return { menu, problems, ready: Boolean(menu.data) }
}
