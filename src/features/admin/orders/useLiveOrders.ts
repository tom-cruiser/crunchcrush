import { useCallback, useEffect, useRef, useState } from 'react'
import { ordersApi } from '@/api'
import { ACTIVE_STATUSES } from '@/features/orders/status'
import { usePreferences } from '@/store/preferences'
import { toast } from '@/store/toast'
import type { Order } from '@/types'
import { playNewOrderChime } from './sound'

const POLL_MS = 5000

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Active orders plus today's finished ones, refreshed every few seconds. Plays a chime and
 * shows a toast when a new order arrives (not on the first load).
 */
export function useLiveOrders() {
  const [orders, setOrders] = useState<Order[]>()
  const [error, setError] = useState<Error>()
  const known = useRef<Set<string>>(undefined)
  const soundAlerts = usePreferences((s) => s.soundAlerts)
  const soundRef = useRef(soundAlerts)
  soundRef.current = soundAlerts

  const load = useCallback(async () => {
    try {
      const [active, finished] = await Promise.all([
        ordersApi.listOrders({ statuses: ACTIVE_STATUSES }),
        ordersApi.listOrders({ statuses: ['delivered', 'rejected', 'cancelled'], since: startOfToday() }),
      ])
      const all = [...active, ...finished]
      const incoming = all.filter((o) => o.status === 'received' && known.current && !known.current.has(o.id))
      if (incoming.length) {
        if (soundRef.current) playNewOrderChime()
        toast.info(incoming.length === 1 ? `New order ${incoming[0].orderNumber}` : `${incoming.length} new orders`, incoming.map((o) => o.customerName).join(', '))
      }
      known.current = new Set(all.map((o) => o.id))
      setOrders(all)
      setError(undefined)
    } catch (e) {
      setError(e as Error)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(id)
  }, [load])

  /** Apply a mutation result immediately instead of waiting for the next poll. */
  const replace = useCallback((order: Order) => setOrders((list) => list?.map((o) => (o.id === order.id ? order : o))), [])

  return { orders, error, reload: load, replace }
}
