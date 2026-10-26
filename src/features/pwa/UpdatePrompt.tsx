import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToasts } from '@/store/toast'

const UPDATE_CHECK_MS = 60 * 60 * 1000

/** Registers the service worker and offers a reload when a new version is ready. */
export function UpdatePrompt() {
  const { t } = useTranslation()
  const push = useToasts((s) => s.push)
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    // Kitchen tablets stay open for days; check for new versions while they run.
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => {
        if (navigator.onLine) void registration.update()
      }, UPDATE_CHECK_MS)
    },
  })

  useEffect(() => {
    if (offlineReady) push({ title: t('pwa.offlineReady'), tone: 'success' })
  }, [offlineReady, push, t])

  useEffect(() => {
    if (needRefresh) {
      push({ title: t('pwa.updateAvailable'), durationMs: 0, action: { label: t('pwa.reload'), onClick: () => void updateServiceWorker(true) } })
    }
  }, [needRefresh, push, t, updateServiceWorker])

  return null
}
