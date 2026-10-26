import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import { getOpenStatus } from '@/features/store/hours'
import { useSettings } from '@/features/store/useSettings'

export function StoreStatusBadge() {
  const { data: settings } = useSettings()
  const { t } = useTranslation()
  if (!settings) return null
  const status = getOpenStatus(settings)
  if (!status.open) return <Badge tone="danger">{t('store.closed')}</Badge>
  if (settings.busyMode) return <Badge tone="warning">{t('store.busy')}</Badge>
  return <Badge tone="success">{t('store.open')}</Badge>
}
