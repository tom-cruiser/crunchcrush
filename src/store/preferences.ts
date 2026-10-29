import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ID } from '@/types'

interface PreferencesState {
  /** Orders this device placed, so guests can find them again. */
  guestOrderIds: ID[]
  /** Per-order access tokens from placing an order; sent back as X-Order-Token. */
  orderTokens: Record<ID, string>
  /** True once the first order has been placed; gates the push-permission prompt. */
  hasOrdered: boolean
  pushPromptDismissed: boolean
  installPromptDismissedAt?: number
  /** Browsing sessions on this device; the install prompt waits for a repeat visit. */
  visitCount: number
  /** Admin: play a sound for new orders. */
  soundAlerts: boolean
  rememberGuestOrder: (id: ID) => void
  rememberOrderToken: (id: ID, token: string) => void
  dismissPushPrompt: () => void
  dismissInstallPrompt: () => void
  recordVisit: () => void
  setSoundAlerts: (on: boolean) => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      guestOrderIds: [],
      orderTokens: {},
      hasOrdered: false,
      pushPromptDismissed: false,
      soundAlerts: true,
      visitCount: 0,
      rememberGuestOrder: (id) => set((s) => ({ guestOrderIds: [id, ...s.guestOrderIds].slice(0, 20), hasOrdered: true })),
      // Kept for the 50 most recent orders, like the guest order list.
      rememberOrderToken: (id, token) => set((s) => ({ orderTokens: Object.fromEntries([[id, token], ...Object.entries(s.orderTokens).filter(([k]) => k !== id)].slice(0, 50)) })),
      dismissPushPrompt: () => set({ pushPromptDismissed: true }),
      dismissInstallPrompt: () => set({ installPromptDismissedAt: Date.now() }),
      recordVisit: () => set((s) => ({ visitCount: s.visitCount + 1 })),
      setSoundAlerts: (soundAlerts) => set({ soundAlerts }),
    }),
    { name: 'cc-prefs', version: 1 },
  ),
)
