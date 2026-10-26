import { create } from 'zustand'

/** Chromium's install event; not in the DOM typings. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null
  installed: boolean
}

export const useInstallState = create<InstallState>(() => ({ deferred: null, installed: false }))

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** iPhone/iPad (including iPadOS, which reports itself as a Mac with touch). Safari there has no install event. */
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * Must run before React renders: Chromium fires `beforeinstallprompt` early and
 * only once, so the event is stashed for the custom prompt to use later.
 */
export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    useInstallState.setState({ deferred: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => useInstallState.setState({ deferred: null, installed: true }))
}

export type InstallMode = 'native' | 'ios' | null

export function useInstall() {
  const { deferred, installed } = useInstallState()
  const mode: InstallMode = installed || isStandalone() ? null : deferred ? 'native' : isIos() ? 'ios' : null

  /** Shows the browser's own dialog; resolves true when the user accepts. */
  const promptNative = async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // The event can only be used once either way.
    useInstallState.setState({ deferred: null, installed: outcome === 'accepted' })
    return outcome === 'accepted'
  }

  return { mode, promptNative }
}
