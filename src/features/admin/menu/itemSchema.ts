import { z } from 'zod'
import { uid } from '@/lib/id'
import type { Allergen, DietaryTag, MenuItem } from '@/types'

export const DIETARY_TAGS: DietaryTag[] = ['vegetarian', 'vegan', 'spicy', 'halal', 'gluten-free']
export const ALLERGENS: Allergen[] = ['gluten', 'eggs', 'dairy', 'nuts', 'soy', 'sesame', 'fish']

const money = z.number({ error: 'Enter an amount' }).int('Whole francs only').min(0, 'Can’t be negative')

const choiceSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name the choice'),
  priceDelta: z.number({ error: 'Enter an amount' }).int('Whole francs only'),
  isAvailable: z.boolean(),
})

const optionSchema = z
  .object({
    id: z.string(),
    name: z.string().trim().min(1, 'Name the option group'),
    required: z.boolean(),
    minSelect: z.number({ error: 'Enter a number' }).int().min(0),
    maxSelect: z.number({ error: 'Enter a number' }).int().min(1, 'At least 1'),
    choices: z.array(choiceSchema).min(1, 'Add at least one choice'),
  })
  .refine((o) => o.minSelect <= o.maxSelect, { path: ['maxSelect'], message: 'Must be ≥ minimum' })
  .refine((o) => o.maxSelect <= o.choices.length, { path: ['maxSelect'], message: 'More than the number of choices' })
  .refine((o) => !o.required || o.minSelect >= 1, { path: ['minSelect'], message: 'Required groups need a minimum of 1' })

const addOnSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name the add-on'),
  price: money,
  maxQuantity: z.number({ error: 'Enter a number' }).int().min(1, 'At least 1').max(10),
  isAvailable: z.boolean(),
})

export const itemSchema = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  name: z.string().trim().min(2, 'Enter a name'),
  description: z.string().trim().max(240, 'Keep it under 240 characters'),
  price: money.min(100, 'At least RWF 100'),
  imageUrl: z.string().min(1, 'Add a photo'),
  prepTimeMinutes: z.number({ error: 'Enter minutes' }).int().min(1).max(120),
  calories: z.number().int().min(0).optional(),
  dietaryTags: z.array(z.enum(DIETARY_TAGS)),
  allergens: z.array(z.enum(ALLERGENS)),
  isAvailable: z.boolean(),
  isPopular: z.boolean(),
  isRecommended: z.boolean(),
  /** Comma-separated in the form, an array on the item. */
  removableIngredients: z.string(),
  options: z.array(optionSchema),
  addOns: z.array(addOnSchema),
})

export type ItemFormValues = z.infer<typeof itemSchema>

export function toFormValues(item: MenuItem | undefined, categoryId: string): ItemFormValues {
  return {
    categoryId: item?.categoryId ?? categoryId,
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price ?? (undefined as unknown as number),
    imageUrl: item?.imageUrl ?? '',
    prepTimeMinutes: item?.prepTimeMinutes ?? 10,
    calories: item?.calories,
    dietaryTags: item?.dietaryTags ?? [],
    allergens: item?.allergens ?? [],
    isAvailable: item?.isAvailable ?? true,
    isPopular: item?.isPopular ?? false,
    isRecommended: item?.isRecommended ?? false,
    removableIngredients: item?.removableIngredients.join(', ') ?? '',
    options: item?.options ?? [],
    addOns: item?.addOns ?? [],
  }
}

export function fromFormValues(values: ItemFormValues, existing: MenuItem | undefined, sortOrder: number): Omit<MenuItem, 'id'> & { id?: string } {
  return {
    ...values,
    id: existing?.id,
    description: values.description.trim(),
    removableIngredients: values.removableIngredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    sortOrder: existing?.sortOrder ?? sortOrder,
  }
}

export const newChoice = () => ({ id: uid('ch'), name: '', priceDelta: 0, isAvailable: true })
export const newOption = () => ({ id: uid('opt'), name: '', required: true, minSelect: 1, maxSelect: 1, choices: [newChoice(), newChoice()] })
export const newAddOn = () => ({ id: uid('add'), name: '', price: 500, maxQuantity: 3, isAvailable: true })

/** Downscale an uploaded photo so it fits comfortably in the mock db (localStorage). */
export function resizeImage(file: File, maxSize = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file isn’t an image we can read'))
    }
    img.src = url
  })
}
