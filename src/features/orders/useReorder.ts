import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMenu } from '@/features/menu/useMenu'
import { useCart } from '@/store/cart'
import { toast } from '@/store/toast'
import type { Order } from '@/types'
import { buildReorder } from './reorder'

/** Adds an old order's items to the cart at today's prices and opens the cart. */
export function useReorder() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const menu = useMenu()
  const addItem = useCart((s) => s.addItem)

  const reorder = (order: Order) => {
    if (!menu.data) return
    const { lines, skipped } = buildReorder(order, menu.data)
    if (lines.length === 0) {
      toast.error(t('orders.reorderNothing'))
      return
    }
    lines.forEach(addItem)
    toast.success(t('orders.reorderAdded', { count: lines.reduce((n, l) => n + l.quantity, 0) }), skipped.length ? t('orders.reorderSkipped', { items: skipped.join(', ') }) : undefined)
    navigate('/cart')
  }

  return { reorder, ready: Boolean(menu.data) }
}
