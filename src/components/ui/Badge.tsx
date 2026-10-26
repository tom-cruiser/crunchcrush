import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'dark' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-ink',
  dark: 'bg-brand text-brand-fg',
  success: 'bg-green-50 text-success ring-1 ring-green-200',
  warning: 'bg-amber-50 text-warning ring-1 ring-amber-200',
  danger: 'bg-red-50 text-danger ring-1 ring-red-200',
  info: 'bg-blue-50 text-info ring-1 ring-blue-200',
  outline: 'bg-surface text-ink ring-1 ring-line',
}

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', tones[tone], className)} {...props} />
}
