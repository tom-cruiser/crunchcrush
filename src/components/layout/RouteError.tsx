import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AlertTriangle, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink } from '@/components/ui'

const RELOAD_KEY = 'cc-chunk-reload'

/** A lazy route chunk failed to load: offline, or a new deploy removed the old files. */
const isChunkError = (e: unknown) => e instanceof Error && /dynamically imported module|Importing a module script failed|Loading chunk/i.test(e.message)

export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  const chunk = isChunkError(error)
  const offline = !navigator.onLine

  // After a deploy, one reload picks up the new files. Guarded so it can't loop.
  useEffect(() => {
    if (!chunk || offline) return
    try {
      if (sessionStorage.getItem(RELOAD_KEY)) return
      sessionStorage.setItem(RELOAD_KEY, '1')
    } catch {
      return
    }
    window.location.reload()
  }, [chunk, offline])

  useEffect(() => {
    if (!chunk) console.error(error)
  }, [chunk, error])

  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface" aria-hidden="true">
        {chunk && offline ? <WifiOff className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
      </span>
      <h1 className="text-xl font-extrabold">{chunk && offline ? t('errors.offlineTitle') : notFound ? t('errors.notFoundTitle') : t('errors.title')}</h1>
      <p className="max-w-sm text-ink-soft">{chunk && offline ? t('errors.offlineBody') : notFound ? t('errors.notFoundBody') : t('errors.body')}</p>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_KEY)
            } catch {
              // Ignore: reload still works.
            }
            window.location.reload()
          }}
        >
          {t('common.retry')}
        </Button>
        <ButtonLink to="/" reloadDocument variant="outline">{t('errors.home')}</ButtonLink>
      </div>
    </main>
  )
}
