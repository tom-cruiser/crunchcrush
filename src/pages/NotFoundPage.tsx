import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ButtonLink, EmptyState } from '@/components/ui'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={<SearchX className="h-6 w-6" />}
      title={t('common.notFoundTitle')}
      description={t('common.notFoundBody')}
      action={
        <ButtonLink to="/">{t('common.goHome')}</ButtonLink>
      }
    />
  )
}
