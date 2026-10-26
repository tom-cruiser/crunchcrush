import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@/i18n'
import '@/styles/index.css'
import { Toaster } from '@/components/ui'
import { listenForInstall } from '@/features/pwa/install'
import { UpdatePrompt } from '@/features/pwa/UpdatePrompt'
import { usePreferences } from '@/store/preferences'
import { router } from './router'

listenForInstall()

// Count one visit per browser session.
try {
  if (!sessionStorage.getItem('cc-visit')) {
    sessionStorage.setItem('cc-visit', '1')
    usePreferences.getState().recordVisit()
  }
} catch {
  // Storage blocked: the install prompt then only appears after an order.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
    <UpdatePrompt />
  </StrictMode>,
)
