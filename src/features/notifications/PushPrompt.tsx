import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, CardBody } from '@/components/ui'
import { usePreferences } from '@/store/preferences'
import { toast } from '@/store/toast'

const supported = () => typeof window !== 'undefined' && 'Notification' in window

/**
 * Asks for notification permission only after the customer's first order, when the
 * value is obvious, instead of on first visit.
 */
export function PushPrompt() {
  const { t } = useTranslation()
  const { hasOrdered, pushPromptDismissed, dismissPushPrompt } = usePreferences()
  const [permission, setPermission] = useState(() => (supported() ? Notification.permission : 'denied'))

  if (!supported() || !hasOrdered || pushPromptDismissed || permission !== 'default') return null

  const allow = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    dismissPushPrompt()
    if (result === 'granted') toast.success(t('confirm.pushOn'))
    else toast.show(t('confirm.pushBlocked'))
  }

  return (
    <Card className="border-ink">
      <CardBody className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="font-bold">{t('confirm.pushTitle')}</p>
          <p className="text-sm text-ink-soft">{t('confirm.pushBody')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={allow}>
              {t('confirm.pushAllow')}
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<BellOff className="h-4 w-4" />} onClick={dismissPushPrompt}>
              {t('confirm.pushLater')}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
