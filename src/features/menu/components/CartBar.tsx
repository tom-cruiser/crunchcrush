import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'
import { cartSubtotal } from '@/lib/pricing'
import { selectCartCount, useCart } from '@/store/cart'

/** Floating "View cart" bar shown on the menu once something is in the cart. */
export function CartBar() {
  const { t } = useTranslation()
  const count = useCart(selectCartCount)
  const subtotal = useCart((s) => cartSubtotal(s.items))
  if (count === 0) return null
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-6">
      <Link
        to="/cart"
        className="pointer-events-auto mx-auto flex h-14 max-w-md animate-fade-in items-center gap-3 rounded-2xl bg-brand px-4 text-brand-fg shadow-xl ring-1 ring-white/25"
      >
        <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-surface px-2 text-sm font-bold text-ink">{count}</span>
        <span className="flex-1 font-bold">{t('menu.viewCart')}</span>
        <span className="font-bold tabular-nums">{formatMoney(subtotal)}</span>
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      </Link>
    </div>
  )
}
