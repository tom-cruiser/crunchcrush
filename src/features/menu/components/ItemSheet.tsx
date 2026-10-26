import { useRef, useState } from 'react'
import { Clock, Heart, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import { Badge, Button, Modal, QuantityStepper, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { toast, useToasts } from '@/store/toast'
import type { CartItem, ItemOption, MenuCategory, MenuItem } from '@/types'
import { initialSelection, invalidOptions, toCartItem, toggleChoice, unitPrice, type Selection } from '../customization'
import { orderability } from '../useMenu'
import { DietaryBadges } from './DietaryBadges'

interface ItemSheetProps {
  item?: MenuItem
  category?: MenuCategory
  /** When set, the sheet edits this cart line instead of adding a new one. */
  editLine?: CartItem
  onClose: () => void
}

export function ItemSheet({ item, category, editLine, onClose }: ItemSheetProps) {
  return (
    <Modal open={Boolean(item)} onClose={onClose} ariaLabel={item?.name ?? 'Item'} variant="auto" size="md" bodyClassName="p-0">
      {item && <ItemCustomizer key={`${item.id}-${editLine?.lineId ?? 'new'}`} item={item} category={category} editLine={editLine} onClose={onClose} />}
    </Modal>
  )
}

function OptionGroup({ option, selected, invalid, onToggle }: { option: ItemOption; selected: string[]; invalid: boolean; onToggle: (choiceId: string) => void }) {
  const { t } = useTranslation()
  const single = option.maxSelect === 1
  const atMax = !single && selected.length >= option.maxSelect
  return (
    <fieldset data-option={option.id} className={cn('rounded-xl border p-4 transition-colors', invalid ? 'border-danger bg-red-50/50' : 'border-line')}>
      <legend className="sr-only">{option.name}</legend>
      <div className="mb-3 flex items-start justify-between gap-3" aria-hidden="true">
        <div>
          <p className="font-bold">{option.name}</p>
          <p className="text-sm text-ink-soft">{single ? t('menu.chooseOne') : t('menu.chooseUpTo', { count: option.maxSelect })}</p>
        </div>
        <Badge tone={option.required ? (invalid ? 'danger' : 'dark') : 'neutral'}>{option.required ? t('menu.required') : t('menu.optional')}</Badge>
      </div>
      {invalid && (
        <p role="alert" className="mb-2 text-sm font-semibold text-danger">
          {t('menu.pleaseChoose')}
        </p>
      )}
      <div className="flex flex-col">
        {option.choices.map((c) => {
          const checked = selected.includes(c.id)
          const disabled = !c.isAvailable || (atMax && !checked)
          return (
            <label key={c.id} className={cn('flex min-h-11 items-center gap-3 py-1', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
              <input
                type={single && option.required ? 'radio' : 'checkbox'}
                name={option.id}
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(c.id)}
                className="h-5 w-5 shrink-0 accent-ink"
              />
              <span className="flex-1">
                {c.name}
                {!c.isAvailable && <span className="ml-2 text-xs font-semibold">· {t('common.soldOut')}</span>}
              </span>
              {c.priceDelta !== 0 && <span className="text-sm text-ink-soft tabular-nums">+{formatMoney(c.priceDelta)}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function ItemCustomizer({ item, category, editLine, onClose }: { item: MenuItem; category?: MenuCategory; editLine?: CartItem; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selection, setSelection] = useState<Selection>(() => initialSelection(item, editLine))
  const [showErrors, setShowErrors] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { addItem, updateItem } = useCart()
  const { customer, setCustomer } = useAuth()
  const pushToast = useToasts((s) => s.push)
  const [favBusy, setFavBusy] = useState(false)

  const { orderable, reason } = orderability(item, category)
  const invalid = invalidOptions(item, selection)
  const total = unitPrice(item, selection) * selection.quantity
  const isFavourite = customer?.favouriteItemIds.includes(item.id) ?? false

  const update = (patch: Partial<Selection>) => setSelection((s) => ({ ...s, ...patch }))

  const submit = () => {
    if (invalid.length) {
      setShowErrors(true)
      containerRef.current?.querySelector(`[data-option="${invalid[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const line = toCartItem(item, selection)
    if (editLine) {
      updateItem(editLine.lineId, line)
      toast.success(t('menu.updateCart'))
    } else {
      addItem(line)
      pushToast({ title: t('menu.added'), description: `${item.name} × ${selection.quantity}`, tone: 'success', action: { label: t('menu.viewCart'), onClick: () => navigate('/cart') } })
    }
    onClose()
  }

  const toggleFav = async () => {
    if (!customer) {
      pushToast({ title: t('menu.signInForFavourites'), action: { label: t('nav.account'), onClick: () => navigate('/login') } })
      return
    }
    setFavBusy(true)
    try {
      setCustomer(await authApi.toggleFavourite(customer.id, item.id))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setFavBusy(false)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col">
      <div className="relative">
        <img src={item.imageUrl} alt="" width={600} height={338} className={cn('aspect-video w-full bg-muted object-cover', !item.isAvailable && 'grayscale')} />
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-md">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl leading-tight font-extrabold">{item.name}</h2>
            <button
              type="button"
              onClick={toggleFav}
              disabled={favBusy}
              aria-pressed={isFavourite}
              aria-label={isFavourite ? t('menu.unfavourite') : t('menu.favourite')}
              className="-mt-1 -mr-2 rounded-full p-2 hover:bg-muted"
            >
              <Heart className={cn('h-6 w-6', isFavourite && 'fill-ink')} />
            </button>
          </div>
          <p className="mt-1 text-ink-soft">{item.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-base font-bold">{formatMoney(item.price)}</span>
            <span className="flex items-center gap-1 text-ink-soft">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {t('menu.prepTime', { count: item.prepTimeMinutes })}
            </span>
            {item.calories && <span className="text-ink-soft">{t('menu.calories', { count: item.calories })}</span>}
          </div>
          <div className="mt-3">
            <DietaryBadges tags={item.dietaryTags} />
          </div>
          {item.allergens.length > 0 && (
            <p className="mt-2 text-sm text-ink-soft">
              <span className="font-semibold text-ink">{t('menu.allergens')}:</span> {item.allergens.map((a) => t(`allergens.${a}`)).join(', ')}
            </p>
          )}
          {!orderable && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm font-semibold">{reason}</p>}
        </div>

        {item.options.map((option) => (
          <OptionGroup
            key={option.id}
            option={option}
            selected={selection.options[option.id] ?? []}
            invalid={showErrors && invalid.includes(option.id)}
            onToggle={(choiceId) => update({ options: { ...selection.options, [option.id]: toggleChoice(option, selection.options[option.id] ?? [], choiceId) } })}
          />
        ))}

        {item.addOns.length > 0 && (
          <section className="rounded-xl border border-line p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">{t('menu.addOns')}</h3>
              <Badge>{t('menu.optional')}</Badge>
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {item.addOns.map((a) => (
                <li key={a.id} className={cn('flex min-h-14 items-center gap-3 py-1.5', !a.isAvailable && 'opacity-50')}>
                  <span className="flex-1">
                    {a.name}
                    <span className="block text-sm text-ink-soft">{a.isAvailable ? `+${formatMoney(a.price)}` : t('common.soldOut')}</span>
                  </span>
                  {a.isAvailable && (
                    <QuantityStepper
                      size="sm"
                      min={0}
                      max={a.maxQuantity}
                      value={selection.addOns[a.id] ?? 0}
                      label={a.name}
                      onChange={(n) => update({ addOns: { ...selection.addOns, [a.id]: Math.max(0, n) } })}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.removableIngredients.length > 0 && (
          <fieldset className="rounded-xl border border-line p-4">
            <legend className="sr-only">{t('menu.remove')}</legend>
            <p className="mb-3 font-bold" aria-hidden="true">
              {t('menu.remove')}
            </p>
            <div className="flex flex-wrap gap-2">
              {item.removableIngredients.map((ing) => {
                const removed = selection.removed.includes(ing)
                return (
                  <button
                    key={ing}
                    type="button"
                    aria-pressed={removed}
                    onClick={() => update({ removed: removed ? selection.removed.filter((r) => r !== ing) : [...selection.removed, ing] })}
                    className={cn('rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors', removed ? 'border-ink bg-brand text-brand-fg line-through' : 'border-line hover:border-ink')}
                  >
                    {t('menu.noIngredient', { name: ing.toLowerCase() })}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <Textarea label={t('menu.note')} placeholder={t('menu.notePlaceholder')} maxLength={140} rows={2} value={selection.note} onChange={(e) => update({ note: e.target.value })} />
      </div>

      <div className="pb-safe sticky bottom-0 mt-5 flex items-center gap-3 border-t border-line bg-surface px-5 py-3">
        <QuantityStepper value={selection.quantity} max={20} onChange={(quantity) => update({ quantity: Math.max(1, quantity) })} />
        <Button fullWidth size="lg" disabled={!orderable} onClick={submit} className="justify-between">
          <span>{orderable ? (editLine ? t('menu.updateCart') : t('menu.addToCart')) : reason}</span>
          {orderable && <span className="tabular-nums">{formatMoney(total)}</span>}
        </Button>
      </div>
    </div>
  )
}
