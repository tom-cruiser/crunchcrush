import { Minus, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  /** Show a bin icon instead of minus at the minimum, for removing cart lines. */
  removable?: boolean
  label?: string
  className?: string
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md', removable, label, className }: QuantityStepperProps) {
  const { t } = useTranslation()
  const btn = cn('flex items-center justify-center rounded-full transition-colors disabled:opacity-30', size === 'sm' ? 'h-8 w-8' : 'h-11 w-11', 'hover:bg-neutral-200')
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const atMin = value <= min
  return (
    <div role="group" aria-label={label ?? t('menu.quantity')} className={cn('inline-flex items-center rounded-full bg-muted', className)}>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={atMin && !removable}
        aria-label={atMin && removable ? t('common.delete') : t('menu.decrease')}
      >
        {atMin && removable ? <Trash2 className={icon} /> : <Minus className={icon} />}
      </button>
      <output aria-live="polite" className={cn('min-w-7 text-center font-bold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t('menu.increase')}>
        <Plus className={icon} />
      </button>
    </div>
  )
}
