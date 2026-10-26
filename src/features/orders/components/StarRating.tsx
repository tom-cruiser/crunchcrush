import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

/** Accessible 1–5 star input built on radio buttons (arrow keys work). */
export function StarRating({ label, value, onChange, name }: { label: string; value: number; onChange: (v: number) => void; name: string }) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            <span className="sr-only">{t('rating.star', { count: n })}</span>
            <Star className={cn('h-8 w-8 transition-colors', n <= value ? 'fill-ink text-ink' : 'text-ink-faint')} aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function StarDisplay({ value, className }: { value: number; className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex', className)} role="img" aria-label={t('rating.star', { count: value })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('h-4 w-4', n <= value ? 'fill-ink text-ink' : 'text-ink-faint')} aria-hidden="true" />
      ))}
    </span>
  )
}
