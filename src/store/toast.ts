import { create } from 'zustand'
import { uid } from '@/lib/id'

export type ToastTone = 'default' | 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  tone: ToastTone
  action?: { label: string; onClick: () => void }
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id' | 'tone'> & { tone?: ToastTone; durationMs?: number }) => string
  dismiss: (id: string) => void
}

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: ({ durationMs = 4000, tone = 'default', ...toast }) => {
    const id = uid('toast')
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, tone, id }] }))
    if (durationMs > 0) setTimeout(() => get().dismiss(id), durationMs)
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Shorthand usable outside React components. */
export const toast = {
  show: (title: string, description?: string) => useToasts.getState().push({ title, description }),
  success: (title: string, description?: string) => useToasts.getState().push({ title, description, tone: 'success' }),
  error: (title: string, description?: string) => useToasts.getState().push({ title, description, tone: 'error', durationMs: 6000 }),
  info: (title: string, description?: string) => useToasts.getState().push({ title, description, tone: 'info' }),
}
