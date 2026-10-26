import type { Allergen, DietaryTag, MenuItem } from '@/types'

export interface MenuFilters {
  query: string
  dietary: DietaryTag[]
  excludeAllergens: Allergen[]
  hideSoldOut: boolean
}

export const EMPTY_FILTERS: MenuFilters = { query: '', dietary: [], excludeAllergens: [], hideSoldOut: false }

export const DIETARY_TAGS: DietaryTag[] = ['vegetarian', 'vegan', 'spicy', 'halal', 'gluten-free']
export const ALLERGENS: Allergen[] = ['gluten', 'eggs', 'dairy', 'nuts', 'soy', 'sesame', 'fish']

export const activeFilterCount = (f: MenuFilters) => f.dietary.length + f.excludeAllergens.length + (f.hideSoldOut ? 1 : 0)

/** Normalises accents and case so "jalapeno" finds "Jalapeños". */
const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function matchesFilters(item: MenuItem, f: MenuFilters): boolean {
  if (f.hideSoldOut && !item.isAvailable) return false
  // Vegan items also satisfy a vegetarian filter.
  if (!f.dietary.every((tag) => item.dietaryTags.includes(tag) || (tag === 'vegetarian' && item.dietaryTags.includes('vegan')))) return false
  if (f.excludeAllergens.some((a) => item.allergens.includes(a))) return false
  const q = normalize(f.query.trim())
  if (!q) return true
  const haystack = normalize([item.name, item.description, ...item.removableIngredients, ...item.addOns.map((a) => a.name), ...item.dietaryTags].join(' '))
  return q.split(/\s+/).every((word) => haystack.includes(word))
}
