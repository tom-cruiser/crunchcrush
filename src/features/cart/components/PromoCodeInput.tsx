import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { promotionsApi } from '@/api'
import { Button, Input } from '@/components/ui'
import { formatMoney } from '@/lib/format'
import { useCart } from '@/store/cart'
import { toast } from '@/store/toast'
import type { Money } from '@/types'

export function PromoCodeInput({ subtotal }: { subtotal: Money }) {
  const { t } = useTranslation()
  const { promo, setPromo } = useCart()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (promo) {
    const short = promo.minOrder - subtotal
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 rounded-xl border border-ink px-3 py-2.5">
          <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-sm">
            <span className="font-bold">{promo.code}</span> · {promo.description}
          </span>
          <button
            type="button"
            aria-label={t('cart.remove')}
            onClick={() => {
              setPromo(undefined)
              toast.show(t('cart.promoRemoved'))
            }}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {short > 0 && <p className="text-sm font-semibold text-warning">{t('cart.promoBelowMin', { amount: formatMoney(short), code: promo.code })}</p>}
      </div>
    )
  }

  const apply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setError(undefined)
    try {
      const result = await promotionsApi.validatePromoCode(code, subtotal)
      setPromo(result)
      setCode('')
      toast.success(t('cart.promoApplied', { code: result.code }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={apply} className="flex items-start gap-2">
      <div className="flex-1">
        <Input
          aria-label={t('cart.promo')}
          placeholder={t('cart.promoPlaceholder')}
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          error={error}
          leftIcon={<Tag className="h-4 w-4" />}
        />
      </div>
      <Button type="submit" variant="outline" className="h-12" loading={busy} disabled={!code.trim()}>
        {t('cart.apply')}
      </Button>
    </form>
  )
}
