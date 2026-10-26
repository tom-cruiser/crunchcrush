import { useMemo } from 'react'
import { Clock, CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { kigaliDate, scheduleSlots } from '@/features/store/hours'
import type { RestaurantSettings } from '@/types'
import { ChoiceCard } from './ChoiceCard'

export interface Timing {
  mode: 'asap' | 'scheduled'
  date?: string
  time?: string
}

interface TimingPickerProps {
  settings: RestaurantSettings
  value: Timing
  onChange: (t: Timing) => void
  isOpen: boolean
  asapMinutes: number
  error?: string
}

export function TimingPicker({ settings, value, onChange, isOpen, asapMinutes, error }: TimingPickerProps) {
  const { t } = useTranslation()
  const days = useMemo(() => scheduleSlots(settings), [settings])
  const selectedDay = days.find((d) => d.date === value.date) ?? days[0]

  const dayLabel = (date: string) => {
    const base = formatDate(`${date}T12:00:00+02:00`, { weekday: 'short', day: 'numeric', month: 'short' })
    if (date === kigaliDate(0)) return `${t('checkout.today')} · ${base}`
    if (date === kigaliDate(1)) return `${t('checkout.tomorrow')} · ${base}`
    return base
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{t('checkout.when')}</legend>
      <ChoiceCard
        name="timing"
        value="asap"
        checked={value.mode === 'asap'}
        disabled={!isOpen}
        onChange={() => onChange({ mode: 'asap' })}
        icon={<Clock className="h-4 w-4" />}
        title={t('checkout.asap')}
        description={isOpen ? t('checkout.asapEta', { minutes: asapMinutes }) : t('checkout.closedOnlySchedule')}
      />
      <ChoiceCard
        name="timing"
        value="scheduled"
        checked={value.mode === 'scheduled'}
        onChange={() => onChange({ mode: 'scheduled', date: selectedDay?.date, time: selectedDay?.slots[0] })}
        icon={<CalendarClock className="h-4 w-4" />}
        title={t('checkout.schedule')}
        disabled={days.length === 0}
        description={days.length === 0 ? t('checkout.noSlots') : undefined}
      />
      {value.mode === 'scheduled' && selectedDay && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Select label={t('checkout.day')} value={selectedDay.date} onChange={(e) => onChange({ mode: 'scheduled', date: e.target.value, time: days.find((d) => d.date === e.target.value)?.slots[0] })}>
            {days.map((d) => (
              <option key={d.date} value={d.date}>
                {dayLabel(d.date)}
              </option>
            ))}
          </Select>
          <Select label={t('checkout.time')} value={value.time} onChange={(e) => onChange({ ...value, time: e.target.value })}>
            {selectedDay.slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
