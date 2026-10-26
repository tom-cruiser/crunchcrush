import i18n from '@/i18n'
import { statusLabel } from '@/features/orders/status'
import { useToasts } from '@/store/toast'
import type { Order } from '@/types'

/**
 * Tells the customer their order changed: an in-app toast always, plus a system
 * notification when permission was granted and the app is in the background.
 */
export function notifyStatusChange(order: Order, onOpen?: () => void) {
  const t = i18n.t.bind(i18n)
  const title = t('tracking.updated', { number: order.orderNumber, status: statusLabel(t, order.status, order.fulfillment) })
  const body = order.status === 'ready' && order.fulfillment === 'pickup' ? t('statusInfo.readyPickup') : t(`statusInfo.${order.status}`)
  useToasts.getState().push({
    title,
    description: body,
    tone: order.status === 'rejected' || order.status === 'cancelled' ? 'error' : order.status === 'delivered' ? 'success' : 'info',
    durationMs: 6000,
    action: onOpen ? { label: t('tracking.view'), onClick: onOpen } : undefined,
  })

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || document.visibilityState === 'visible') return
  const options: NotificationOptions = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: order.id }
  // Prefer the service worker so the notification works on Android when installed.
  void navigator.serviceWorker?.getRegistration().then((reg) => {
    if (reg) return reg.showNotification(title, options)
    new Notification(title, options)
  })
}
