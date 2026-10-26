import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ID } from '@/types'

interface PreferencesState {
  /** Orders this device placed, so guests can find them again. */
  guestOrderIds: ID[]
  /** True once the first order has been placed; gates the push-permission prompt. */
  hasOrdered: boolean
  pushPromptDismissed: boolean
  installPromptDismissedAt?: number
  /** Browsing sessions on this device; the install prompt waits for a repeat visit. */
  visitCount: number
  /** Admin: play a sound for new orders. */
  soundAlerts: boolean
  rememberGuestOrder: (id: ID) => void
  dismissPushPrompt: () => void
  dismissInstallPrompt: () => void
  recordVisit: () => void
  setSoundAlerts: (on: boolean) => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      guestOrderIds: [],
      hasOrdered: false,
      pushPromptDismissed: false,
      soundAlerts: true,
      visitCount: 0,
      rememberGuestOrder: (id) => set((s) => ({ guestOrderIds: [id, ...s.guestOrderIds].slice(0, 20), hasOrdered: true })),
      dismissPushPrompt: () => set({ pushPromptDismissed: true }),
      dismissInstallPrompt: () => set({ installPromptDismissedAt: Date.now() }),
      recordVisit: () => set((s) => ({ visitCount: s.visitCount + 1 })),
      setSoundAlerts: (soundAlerts) => set({ soundAlerts }),
    }),
    { name: 'cc-prefs', version: 1 },
  ),
)
