import i18n from '@/i18n'
import type { Money } from '@/types'

const TIMEZONE = 'Africa/Kigali'

/** Intl locale for the active UI language, Rwanda region. */
const intlLocale = () => (i18n.language === 'fr' ? 'fr-RW' : i18n.language === 'rw' ? 'rw-RW' : 'en-RW')

/** "RWF 6,500". RWF has no minor unit, so amounts are whole numbers. */
export function formatMoney(amount: Money): string {
  const n = new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 0 }).format(amount)
  return `RWF ${n}`
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Intl.DateTimeFormat(intlLocale(), { timeZone: TIMEZONE, ...opts }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso, { day: 'numeric', month: 'short' })}, ${formatTime(iso)}`
}

/** "3 min ago", "in 20 min", "yesterday". */
export function formatRelative(iso: string, now = Date.now()): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto' })
  const abs = Math.abs(diffSeconds)
  if (abs < 60) return rtf.format(diffSeconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour')
  return rtf.format(Math.round(diffSeconds / 86400), 'day')
}

/** "+250 788 123 456" */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('250') && d.length === 12) return `+250 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`
  return phone
}
