import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { ordersApi } from '@/api'
import { notifyStatusChange } from '@/features/notifications/notify'
import { useAuth } from '@/store/auth'
import { usePreferences } from '@/store/preferences'
import type { Order, OrderStatus } from '@/types'
import { isActive } from './status'

const POLL_MS = 8000

/** The customer's in-progress orders, shared by the banner and the orders page. */
export const useActiveOrders = create<{ orders: Order[]; set: (orders: Order[]) => void }>()((set) => ({
  orders: [],
  set: (orders) => set({ orders }),
}))

/**
 * Polls the customer's active orders from anywhere in the customer app and notifies on
 * status changes. With a real backend this becomes a WebSocket/SSE subscription or web push.
 */
export function useOrderWatcher() {
  const customerId = useAuth((s) => s.customer?.id)
  const guestOrderIds = usePreferences((s) => s.guestOrderIds)
  const setActive = useActiveOrders((s) => s.set)
  const navigate = useNavigate()
  const location = useLocation()
  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname
  const known = useRef<Map<string, OrderStatus>>(new Map())

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    known.current = new Map()

    const tick = async () => {
      try {
        const orders = customerId ? await ordersApi.listCustomerOrders(customerId) : guestOrderIds.length ? await ordersApi.listOrdersByIds(guestOrderIds) : []
        if (cancelled) return
        for (const o of orders) {
          const previous = known.current.get(o.id)
          if (previous && previous !== o.status) {
            const onTrackingPage = pathRef.current === `/order/${o.id}`
            notifyStatusChange(o, onTrackingPage ? undefined : () => navigate(`/order/${o.id}`))
          }
          known.current.set(o.id, o.status)
        }
        const active = orders.filter((o) => isActive(o.status))
        setActive(active)
        if (active.length) timer = setTimeout(tick, POLL_MS)
      } catch {
        if (!cancelled) timer = setTimeout(tick, POLL_MS * 2)
      }
    }
    void tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [customerId, guestOrderIds, navigate, setActive])
}
