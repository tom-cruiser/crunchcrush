import type { RestaurantSettings, Weekday } from '@/types'

const DAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/** Current date parts in Kigali time, whatever the device timezone. */
function kigaliNow(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    day: get('weekday').toLowerCase().slice(0, 3) as Weekday,
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

export interface OpenStatus {
  open: boolean
  reason?: 'manual' | 'holiday' | 'hours'
  /** Today's hours as "07:00–22:00", or undefined when closed all day. */
  todayHours?: string
  holidayReason?: string
}

export function getOpenStatus(settings: RestaurantSettings, now = new Date()): OpenStatus {
  const { day, date, time } = kigaliNow(now)
  const today = settings.openingHours.find((h) => h.day === day)
  const todayHours = today && !today.closed ? `${today.open}–${today.close}` : undefined
  if (!settings.isOpen) return { open: false, reason: 'manual', todayHours }
  const holiday = settings.holidayClosures.find((h) => h.date === date)
  if (holiday) return { open: false, reason: 'holiday', holidayReason: holiday.reason }
  if (!today || today.closed || time < today.open || time >= today.close) return { open: false, reason: 'hours', todayHours }
  return { open: true, todayHours }
}

export { DAYS }

/** Whether a category with an availability window (e.g. breakfast) can be ordered right now. */
export function isWithinWindow(from: string | undefined, to: string | undefined, now = new Date()): boolean {
  if (!from || !to) return true
  const { time } = kigaliNow(now)
  return time >= from && time < to
}

export interface ScheduleDay {
  /** "YYYY-MM-DD" in Kigali time */
  date: string
  weekday: Weekday
  /** "HH:mm" slots */
  slots: string[]
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const toHHMM = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** Kigali is UTC+2 all year, so a local slot maps to a fixed ISO offset. */
export const slotToIso = (date: string, time: string) => new Date(`${date}T${time}:00+02:00`).toISOString()

/**
 * 15-minute slots for today and the next `days - 1` days, from 30 minutes after opening
 * to 30 minutes before closing, at least `leadMinutes` from now. Skips holidays and closed days.
 */
export function scheduleSlots(settings: RestaurantSettings, now = new Date(), days = 3, leadMinutes = 45): ScheduleDay[] {
  const result: ScheduleDay[] = []
  for (let i = 0; i < days; i++) {
    const { day, date, time } = kigaliNow(new Date(now.getTime() + i * 86_400_000))
    const hours = settings.openingHours.find((h) => h.day === day)
    if (!hours || hours.closed || settings.holidayClosures.some((h) => h.date === date)) continue
    const earliest = i === 0 ? toMinutes(time) + leadMinutes : 0
    const start = Math.max(toMinutes(hours.open) + 30, Math.ceil(earliest / 15) * 15)
    const slots: string[] = []
    for (let m = start; m <= toMinutes(hours.close) - 30; m += 15) slots.push(toHHMM(m))
    if (slots.length) result.push({ date, weekday: day, slots })
  }
  return result
}

/** "YYYY-MM-DD" in Kigali, optionally `offsetDays` from now. */
export const kigaliDate = (offsetDays = 0, now = new Date()) => kigaliNow(new Date(now.getTime() + offsetDays * 86_400_000)).date
