import type { ReactNode } from 'react'
import { AlertTriangle, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-ink-soft">{icon}</div>}
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-xs text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, className }: { error?: Error; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation()
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  return (
    <EmptyState
      className={className}
      icon={offline ? <WifiOff className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
      title={offline ? 'You’re offline' : t('common.somethingWrong')}
      description={offline ? 'This screen isn’t saved for offline use yet. Reconnect and try again.' : error?.message}
      action={onRetry && <Button variant="outline" onClick={onRetry}>{t('common.retry')}</Button>}
    />
  )
}
