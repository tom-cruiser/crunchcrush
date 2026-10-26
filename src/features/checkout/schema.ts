import { z } from 'zod'
import type { PaymentMethod } from '@/types'

const digits = (s: string) => s.replace(/\D/g, '')

/** Normalises 078…, 25078…, +250 78… to +25078…. */
export function normalizeRwPhone(input: string): string {
  const d = digits(input)
  if (d.startsWith('250')) return `+${d}`
  if (d.startsWith('0')) return `+250${d.slice(1)}`
  return `+250${d}`
}

/** Rwandan mobile: 07[2389] followed by 7 digits. */
export const isRwMobile = (input: string) => /^\+2507[2389]\d{7}$/.test(normalizeRwPhone(input))
/** MTN uses 078/079, Airtel 072/073. */
export const isMtn = (input: string) => /^\+2507[89]/.test(normalizeRwPhone(input))
export const isAirtel = (input: string) => /^\+2507[23]/.test(normalizeRwPhone(input))

function luhn(number: string) {
  let sum = 0
  for (let i = 0; i < number.length; i++) {
    let n = Number(number[number.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name'),
    phone: z.string().refine(isRwMobile, 'Enter a Rwandan mobile number, e.g. 078 123 4567'),
    email: z.union([z.literal(''), z.email('Enter a valid email')]),
    paymentMethod: z.enum(['mtn_momo', 'airtel_money', 'card', 'cash'] satisfies [PaymentMethod, ...PaymentMethod[]]),
    momoPhone: z.string(),
    cardNumber: z.string(),
    cardExpiry: z.string(),
    cardCvc: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod === 'mtn_momo' && !(isRwMobile(v.momoPhone) && isMtn(v.momoPhone))) {
      ctx.addIssue({ code: 'custom', path: ['momoPhone'], message: 'Enter an MTN number (078 or 079)' })
    }
    if (v.paymentMethod === 'airtel_money' && !(isRwMobile(v.momoPhone) && isAirtel(v.momoPhone))) {
      ctx.addIssue({ code: 'custom', path: ['momoPhone'], message: 'Enter an Airtel number (072 or 073)' })
    }
    if (v.paymentMethod === 'card') {
      const n = digits(v.cardNumber)
      if (n.length < 13 || n.length > 19 || !luhn(n)) ctx.addIssue({ code: 'custom', path: ['cardNumber'], message: 'Enter a valid card number' })
      const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(v.cardExpiry)
      const now = new Date()
      const expired = m && (2000 + Number(m[2]) < now.getFullYear() || (2000 + Number(m[2]) === now.getFullYear() && Number(m[1]) < now.getMonth() + 1))
      if (!m || Number(m[1]) < 1 || Number(m[1]) > 12 || expired) ctx.addIssue({ code: 'custom', path: ['cardExpiry'], message: 'Enter a valid expiry date' })
      if (!/^\d{3,4}$/.test(v.cardCvc)) ctx.addIssue({ code: 'custom', path: ['cardCvc'], message: 'Enter the 3 or 4 digit code' })
    }
  })

export type CheckoutValues = z.infer<typeof checkoutSchema>

export const formatCardNumber = (s: string) =>
  digits(s)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

export const formatExpiry = (s: string) => {
  const d = digits(s).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}
