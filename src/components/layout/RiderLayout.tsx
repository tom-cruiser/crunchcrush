import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OfflineBanner } from '@/features/pwa/OfflineBanner'
import { useAuth } from '@/store/auth'
import { PageLoader } from './PageLoader'

export function RiderLayout() {
  const { t } = useTranslation()
  const { staff, signOutStaff } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col bg-muted">
      <OfflineBanner />
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-brand px-4 text-brand-fg">
        <img src="/favicon.svg" alt="" className="h-8 w-8 invert" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{t('rider.title')}</p>
          {staff && <p className="truncate text-xs text-neutral-400">{staff.name}</p>}
        </div>
        <button
          type="button"
          aria-label={t('admin.signOut')}
          onClick={() => {
            signOutStaff()
            navigate('/admin/login')
          }}
          className="rounded-full p-2 hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>
      <main id="main" className="mx-auto w-full max-w-lg flex-1 p-4">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
