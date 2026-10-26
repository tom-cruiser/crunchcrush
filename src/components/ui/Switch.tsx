import { useId } from 'react'
import { cn } from '@/lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Switch({ checked, onChange, label, hideLabel, description, disabled, size = 'md', className }: SwitchProps) {
  const id = useId()
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        aria-labelledby={hideLabel ? undefined : `${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-6 w-10' : 'h-7 w-12',
          checked ? 'bg-ink' : 'bg-neutral-300',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block rounded-full bg-white shadow transition-transform',
            size === 'sm' ? 'h-5 w-5' : 'h-6 w-6',
            checked ? (size === 'sm' ? 'translate-x-[18px]' : 'translate-x-[22px]') : 'translate-x-0.5',
          )}
        />
      </button>
      {!hideLabel && (
        <label id={`${id}-label`} htmlFor={id} className="min-w-0 cursor-pointer">
          <span className="block text-sm font-semibold">{label}</span>
          {description && <span className="block text-xs text-ink-soft">{description}</span>}
        </label>
      )}
    </div>
  )
}
