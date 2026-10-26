import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink, Card, CardBody, EmptyState, ErrorState, Modal, SkeletonList } from '@/components/ui'
import { CartLine } from '@/features/cart/components/CartLine'
import { PriceSummary } from '@/features/cart/components/PriceSummary'
import { PromoCodeInput } from '@/features/cart/components/PromoCodeInput'
import { useCartValidation } from '@/features/cart/useCartValidation'
import { ItemSheet } from '@/features/menu/components/ItemSheet'
import { useOnline } from '@/features/pwa/useOnline'
import { useSettings } from '@/features/store/useSettings'
import { formatMoney } from '@/lib/format'
import { calculatePricing } from '@/lib/pricing'
import { useCart } from '@/store/cart'
import type { CartItem } from '@/types'

export default function CartPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const online = useOnline()
  const { items, fulfillment, promo, setQuantity, removeItem, clear } = useCart()
  const settings = useSettings()
  const { menu, problems, ready } = useCartValidation(items)
  const [editing, setEditing] = useState<CartItem>()
  const [confirmClear, setConfirmClear] = useState(false)

  if (items.length === 0) {
    return (
      <>
        <h1 className="sr-only">{t('cart.title')}</h1>
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title={t('cart.empty')}
          description={t('cart.emptyBody')}
          action={
            <ButtonLink to="/">{t('cart.browseMenu')}</ButtonLink>
          }
        />
      </>
    )
  }
  if (settings.error && !settings.data) return <ErrorState error={settings.error} onRetry={settings.reload} />
  if (!settings.data || !ready) return <SkeletonList rows={3} label={t('common.loading')} />

  const pricing = calculatePricing({ items, fulfillment, deliveryFee: 0, settings: settings.data, promo })
  const missing = settings.data.minimumOrder - pricing.subtotal
  const blocked = problems.size > 0 || missing > 0 || !online
  const editingItem = editing ? menu.data?.itemsById.get(editing.itemId) : undefined

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/" aria-label={t('common.back')} className="-ml-2 rounded-full p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-extrabold">{t('cart.title')}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
          {t('cart.clear')}
        </Button>
      </div>

      <Card>
        <CardBody className="py-0">
          <ul className="divide-y divide-line">
            {items.map((line) => (
              <CartLine
                key={line.lineId}
                line={line}
                unavailableReason={problems.get(line.lineId)}
                onQuantity={(q) => setQuantity(line.lineId, q)}
                onEdit={() => setEditing(line)}
                onRemove={() => removeItem(line.lineId)}
              />
            ))}
          </ul>
          <div className="border-t border-line py-3">
            <Link to="/" className="text-sm font-semibold underline underline-offset-2">
              + {t('cart.addMore')}
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <PromoCodeInput subtotal={pricing.subtotal} />
          <PriceSummary pricing={pricing} settings={settings.data} promo={promo} deliveryPending={fulfillment === 'delivery'} showDelivery={fulfillment === 'delivery'} />
        </CardBody>
      </Card>

      <div className="pb-safe sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-2 bg-surface/95 py-3 backdrop-blur md:bottom-0">
        {missing > 0 && (
          <p role="status" className="text-center text-sm font-semibold">
            {t('cart.minOrder', { amount: formatMoney(settings.data.minimumOrder), missing: formatMoney(missing) })}
          </p>
        )}
        {!online && (
          <p role="status" className="flex items-center justify-center gap-2 text-sm font-semibold">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            {t('offline.checkoutBlocked')}
          </p>
        )}
        <Button size="lg" fullWidth disabled={blocked} onClick={() => navigate('/checkout')} className="justify-between">
          <span>{t('cart.checkout')}</span>
          <span className="tabular-nums">{formatMoney(pricing.total)}</span>
        </Button>
      </div>

      <ItemSheet item={editingItem} category={editingItem ? menu.data?.categoriesById.get(editingItem.categoryId) : undefined} editLine={editing} onClose={() => setEditing(undefined)} />

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={t('cart.clear')}
        size="sm"
        variant="center"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setConfirmClear(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                clear()
                setConfirmClear(false)
              }}
            >
              {t('cart.clear')}
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft">{t('cart.clearConfirm')}</p>
      </Modal>
    </div>
  )
}
