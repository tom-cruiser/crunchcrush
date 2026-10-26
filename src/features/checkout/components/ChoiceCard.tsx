import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ChoiceCardProps {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  disabled?: boolean
  className?: string
}

/** Radio styled as a selectable card. Use inside a <fieldset> with a <legend>. */
export function ChoiceCard({ name, value, checked, onChange, title, description, icon, disabled, className }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        'flex min-h-14 items-center gap-3 rounded-xl border p-3 transition-colors',
        checked ? 'border-ink bg-muted ring-1 ring-ink' : 'border-line hover:border-ink-soft',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} className="sr-only" />
      {icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-line">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {description && <span className="block text-sm text-ink-soft">{description}</span>}
      </span>
      <span aria-hidden="true" className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', checked ? 'border-ink' : 'border-ink-faint')}>
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
    </label>
  )
}
