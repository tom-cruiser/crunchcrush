import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOnline } from './useOnline'

export function OfflineBanner() {
  const online = useOnline()
  const { t } = useTranslation()
  if (online) return null
  return (
    <div role="status" className="no-print flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-sm font-medium text-white">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      {t('offline.banner')}
    </div>
  )
}
