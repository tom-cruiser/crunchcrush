import { z } from 'zod'
import type { FulfillmentType, PaymentMethod, RestaurantSettings, Weekday } from '@/types'

export const WEEK: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
export const PAYMENT_METHODS: PaymentMethod[] = ['mtn_momo', 'airtel_money', 'card', 'cash']
export const FULFILLMENT_TYPES: FulfillmentType[] = ['delivery', 'pickup', 'dine-in']

const time = z.string().regex(/^\d{2}:\d{2}$/, 'Enter a time')
const whole = (msg: string) => z.number({ error: msg }).int('Whole numbers only').min(0, 'Can’t be negative')

export const settingsSchema = z.object({
  name: z.string().trim().min(2, 'Enter the restaurant name'),
  tagline: z.string().trim().max(80, 'Keep it under 80 characters'),
  phone: z.string().trim().regex(/^\+?\d[\d\s]{8,}$/, 'Enter a phone number'),
  whatsapp: z.string().trim(),
  email: z.email('Enter a valid email'),
  street: z.string().trim().min(2, 'Enter the street'),
  area: z.string().trim().min(2, 'Enter the area'),
  openingHours: z.array(
    z
      .object({ day: z.enum(WEEK), open: time, close: time, closed: z.boolean() })
      .refine((h) => h.closed || h.open < h.close, { path: ['close'], message: 'Must be after opening' }),
  ),
  holidayClosures: z.array(z.object({ id: z.string(), date: z.string().min(1, 'Pick a date'), reason: z.string().trim().min(2, 'Add a reason') })),
  busyExtraMinutes: whole('Enter minutes').min(5, 'At least 5').max(90),
  defaultPrepTimeMinutes: whole('Enter minutes').min(5, 'At least 5').max(120),
  minimumOrder: whole('Enter an amount'),
  taxRatePercent: z.number({ error: 'Enter a rate' }).min(0).max(50),
  taxInclusive: z.boolean(),
  serviceChargePercent: z.number({ error: 'Enter a rate' }).min(0).max(25),
  tableCount: whole('Enter a number').max(200),
  enabledPaymentMethods: z.array(z.enum(PAYMENT_METHODS)).min(1, 'Keep at least one payment method'),
  fulfillmentTypes: z.array(z.enum(FULFILLMENT_TYPES)).min(1, 'Keep at least one way to order'),
})

export type SettingsValues = z.infer<typeof settingsSchema>

export function toValues(s: RestaurantSettings): SettingsValues {
  return {
    name: s.name,
    tagline: s.tagline,
    phone: s.phone,
    whatsapp: s.whatsapp ?? '',
    email: s.email,
    street: s.address.street,
    area: s.address.area,
    openingHours: WEEK.map((day) => s.openingHours.find((h) => h.day === day) ?? { day, open: '08:00', close: '22:00', closed: true }),
    holidayClosures: [...s.holidayClosures].sort((a, b) => a.date.localeCompare(b.date)),
    busyExtraMinutes: s.busyExtraMinutes,
    defaultPrepTimeMinutes: s.defaultPrepTimeMinutes,
    minimumOrder: s.minimumOrder,
    taxRatePercent: s.taxRatePercent,
    taxInclusive: s.taxInclusive,
    serviceChargePercent: s.serviceChargePercent,
    tableCount: s.tableCount,
    enabledPaymentMethods: s.enabledPaymentMethods,
    fulfillmentTypes: s.fulfillmentTypes,
  }
}

export function toPatch(v: SettingsValues, current: RestaurantSettings): Partial<RestaurantSettings> {
  const { street, area, whatsapp, ...rest } = v
  return {
    ...rest,
    whatsapp: whatsapp || undefined,
    address: { ...current.address, street, area },
    // Keep the canonical order so the customer app lists them consistently.
    enabledPaymentMethods: PAYMENT_METHODS.filter((m) => v.enabledPaymentMethods.includes(m)),
    fulfillmentTypes: FULFILLMENT_TYPES.filter((f) => v.fulfillmentTypes.includes(f)),
  }
}
