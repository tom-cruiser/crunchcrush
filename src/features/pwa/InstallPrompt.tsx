import { useState } from 'react'
import { Download, PlusSquare, Share, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, CardBody, Modal } from '@/components/ui'
import { usePreferences } from '@/store/preferences'
import { toast } from '@/store/toast'
import { useInstall } from './install'

const SNOOZE_MS = 14 * 86_400_000

/** Returns a handler that installs natively or opens the iOS instructions. */
export function useInstallAction() {
  const { t } = useTranslation()
  const { mode, promptNative } = useInstall()
  const [iosHelp, setIosHelp] = useState(false)
  const run = async () => {
    if (mode === 'ios') return setIosHelp(true)
    if (await promptNative()) toast.success(t('install.done'))
  }
  const sheet = <IosInstallSheet open={iosHelp} onClose={() => setIosHelp(false)} />
  return { mode, run, sheet }
}

/**
 * Suggests installing once the customer has a reason to come back (an order, or a
 * repeat visit), never on the first look. Dismissing snoozes it for two weeks.
 */
export function InstallPrompt() {
  const { t } = useTranslation()
  const { hasOrdered, visitCount, installPromptDismissedAt, dismissInstallPrompt } = usePreferences()
  const { mode, run, sheet } = useInstallAction()
  const snoozed = installPromptDismissedAt !== undefined && Date.now() - installPromptDismissedAt < SNOOZE_MS

  if (!mode || snoozed || (!hasOrdered && visitCount < 2)) return sheet

  return (
    <>
      <Card className="border-ink">
        <CardBody className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="font-bold">{t('install.title')}</p>
            <p className="text-sm text-ink-soft">{t('install.body')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={run}>
                {t('install.cta')}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismissInstallPrompt}>
                {t('install.later')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      {sheet}
    </>
  )
}

function IosInstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const steps = [
    { icon: <Share className="h-5 w-5" />, text: t('install.iosStep1') },
    { icon: <PlusSquare className="h-5 w-5" />, text: t('install.iosStep2') },
    { icon: <Smartphone className="h-5 w-5" />, text: t('install.iosStep3') },
  ]
  return (
    <Modal open={open} onClose={onClose} title={t('install.iosTitle')} size="sm" footer={<Button fullWidth onClick={onClose}>{t('common.done')}</Button>}>
      <ol className="flex flex-col gap-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted" aria-hidden="true">
              {s.icon}
            </span>
            <span>
              <span className="font-bold">{i + 1}. </span>
              {s.text}
            </span>
          </li>
        ))}
      </ol>
    </Modal>
  )
}
