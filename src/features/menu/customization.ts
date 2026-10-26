import type { CartItem, ItemOption, MenuItem, Money, SelectedAddOn, SelectedOption } from '@/types'

/** What the customer has picked in the item sheet. */
export interface Selection {
  /** optionId -> chosen choice ids */
  options: Record<string, string[]>
  /** addOnId -> quantity */
  addOns: Record<string, number>
  removed: string[]
  note: string
  quantity: number
}

/** Pre-selects the first available choice of single-choice required options so most items are one tap to add. */
export function initialSelection(item: MenuItem, from?: CartItem): Selection {
  if (from) {
    return {
      options: Object.fromEntries(from.selectedOptions.map((o) => [o.optionId, o.choiceIds])),
      addOns: Object.fromEntries(from.selectedAddOns.map((a) => [a.addOnId, a.quantity])),
      removed: from.removedIngredients,
      note: from.note ?? '',
      quantity: from.quantity,
    }
  }
  const options: Record<string, string[]> = {}
  for (const o of item.options) {
    const first = o.choices.find((c) => c.isAvailable)
    options[o.id] = o.required && o.maxSelect === 1 && first ? [first.id] : []
  }
  return { options, addOns: {}, removed: [], note: '', quantity: 1 }
}

export function toggleChoice(option: ItemOption, current: string[], choiceId: string): string[] {
  if (option.maxSelect === 1) return option.required ? [choiceId] : current[0] === choiceId ? [] : [choiceId]
  if (current.includes(choiceId)) return current.filter((id) => id !== choiceId)
  if (current.length >= option.maxSelect) return current
  return [...current, choiceId]
}

/** Returns option ids that don't meet their min/max rules. */
export function invalidOptions(item: MenuItem, selection: Selection): string[] {
  return item.options
    .filter((o) => {
      const n = selection.options[o.id]?.length ?? 0
      return n < (o.required ? Math.max(1, o.minSelect) : o.minSelect) || n > o.maxSelect
    })
    .map((o) => o.id)
}

export function unitPrice(item: MenuItem, selection: Selection): Money {
  let price = item.price
  for (const o of item.options) {
    for (const id of selection.options[o.id] ?? []) price += o.choices.find((c) => c.id === id)?.priceDelta ?? 0
  }
  for (const a of item.addOns) price += a.price * (selection.addOns[a.id] ?? 0)
  return price
}

export function toCartItem(item: MenuItem, selection: Selection): Omit<CartItem, 'lineId'> {
  const selectedOptions: SelectedOption[] = item.options
    .filter((o) => (selection.options[o.id]?.length ?? 0) > 0)
    .map((o) => {
      const choices = o.choices.filter((c) => selection.options[o.id].includes(c.id))
      return {
        optionId: o.id,
        optionName: o.name,
        choiceIds: choices.map((c) => c.id),
        choiceNames: choices.map((c) => c.name),
        priceDelta: choices.reduce((s, c) => s + c.priceDelta, 0),
      }
    })
  const selectedAddOns: SelectedAddOn[] = item.addOns
    .filter((a) => (selection.addOns[a.id] ?? 0) > 0)
    .map((a) => ({ addOnId: a.id, name: a.name, unitPrice: a.price, quantity: selection.addOns[a.id] }))
  return {
    itemId: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    basePrice: item.price,
    quantity: selection.quantity,
    selectedOptions,
    selectedAddOns,
    removedIngredients: selection.removed,
    note: selection.note.trim() || undefined,
    unitPrice: unitPrice(item, selection),
  }
}

/** One-line summary of a cart line's customizations, e.g. "Crunchy shell · Hot · +Guacamole · No onion". */
export function describeCustomization(line: Pick<CartItem, 'selectedOptions' | 'selectedAddOns' | 'removedIngredients'>): string {
  return [
    ...line.selectedOptions.flatMap((o) => o.choiceNames),
    ...line.selectedAddOns.map((a) => `+${a.name}${a.quantity > 1 ? ` ×${a.quantity}` : ''}`),
    ...line.removedIngredients.map((r) => `No ${r.toLowerCase()}`),
  ].join(' · ')
}
