import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bike, Store, UtensilsCrossed, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, authApi, ordersApi, paymentsApi } from '@/api'
import { Button, Card, CardBody, ErrorState, Input, SkeletonList } from '@/components/ui'
import { PriceSummary } from '@/features/cart/components/PriceSummary'
import { useCartValidation } from '@/features/cart/useCartValidation'
import { AddressPicker, useZoneCheck, type AddressDraft } from '@/features/checkout/components/AddressPicker'
import { ChoiceCard } from '@/features/checkout/components/ChoiceCard'
import { PaymentMethodPicker } from '@/features/checkout/components/PaymentMethodPicker'
import { TimingPicker, type Timing } from '@/features/checkout/components/TimingPicker'
import { checkoutSchema, normalizeRwPhone, type CheckoutValues } from '@/features/checkout/schema'
import { describeCustomization } from '@/features/menu/customization'
import { useOnline } from '@/features/pwa/useOnline'
import { getOpenStatus, scheduleSlots, slotToIso } from '@/features/store/hours'
import { useSettings } from '@/features/store/useSettings'
import { formatMoney } from '@/lib/format'
import { calculatePricing, cartSubtotal } from '@/lib/pricing'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { usePreferences } from '@/store/preferences'
import { toast } from '@/store/toast'
import type { FulfillmentType, RestaurantSettings } from '@/types'

function Section({ step, title, children, id }: { step: number; title: string; children: ReactNode; id?: string }) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardBody className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-brand-fg">
            {step}
          </span>
          {title}
        </h2>
        {children}
      </CardBody>
    </Card>
  )
}

const FULFILLMENT_ICONS: Record<FulfillmentType, ReactNode> = {
  delivery: <Bike className="h-4 w-4" />,
  pickup: <Store className="h-4 w-4" />,
  'dine-in': <UtensilsCrossed className="h-4 w-4" />,
}

export default function CheckoutPage() {
  const settings = useSettings()
  const { items } = useCart()
  const { problems, ready } = useCartValidation(items)
  const placedRef = useRef(false)

  if (items.length === 0 && !placedRef.current) return <Navigate to="/cart" replace />
  if (settings.error && !settings.data) return <ErrorState error={settings.error} onRetry={settings.reload} />
  if (!settings.data || !ready) return <SkeletonList rows={4} />
  if (problems.size > 0 && !placedRef.current) return <Navigate to="/cart" replace />
  return <CheckoutForm settings={settings.data} placedRef={placedRef} />
}

function CheckoutForm({ settings, placedRef }: { settings: RestaurantSettings; placedRef: React.RefObject<boolean> }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const online = useOnline()
  const { items, fulfillment, setFulfillment, tableNumber, setTable, promo, clear } = useCart()
  const { customer, setCustomer } = useAuth()
  const rememberGuestOrder = usePreferences((s) => s.rememberGuestOrder)

  const status = getOpenStatus(settings)
  const fulfillmentTypes = settings.fulfillmentTypes
  const activeFulfillment = fulfillmentTypes.includes(fulfillment) ? fulfillment : fulfillmentTypes[0]

  const defaultAddress = customer?.addresses.find((a) => a.isDefault) ?? customer?.addresses[0]
  const [addressDraft, setAddressDraft] = useState<AddressDraft>({ address: defaultAddress, isNew: !defaultAddress, save: true })
  const { zone, loading: zoneLoading } = useZoneCheck(activeFulfillment === 'delivery' ? addressDraft.address : undefined)
  const [tableInput, setTableInput] = useState(tableNumber ? String(tableNumber) : '')
  const [timing, setTiming] = useState<Timing>(() => {
    if (status.open) return { mode: 'asap' }
    const first = scheduleSlots(settings)[0]
    return { mode: 'scheduled', date: first?.date, time: first?.slots[0] }
  })
  const [sectionErrors, setSectionErrors] = useState<{ address?: string; table?: string; timing?: string }>({})
  const [placing, setPlacing] = useState(false)

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      paymentMethod: settings.enabledPaymentMethods[0],
      momoPhone: customer?.phone ?? '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    },
  })
  const {
    register,
    getValues,
    setValue,
    formState: { errors },
  } = form

  const deliveryFee = activeFulfillment === 'delivery' && zone?.deliverable && zone.zone ? zone.zone.fee : 0
  const pricing = useMemo(() => calculatePricing({ items, fulfillment: activeFulfillment, deliveryFee, settings, promo }), [items, activeFulfillment, deliveryFee, settings, promo])
  const busyExtra = settings.busyMode ? settings.busyExtraMinutes : 0
  const asapMinutes = (activeFulfillment === 'delivery' ? (zone?.zone?.estimatedMinutes ?? 30) : settings.defaultPrepTimeMinutes) + busyExtra
  const zoneMinShort = activeFulfillment === 'delivery' && zone?.zone ? zone.zone.minOrder - cartSubtotal(items) : 0
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  const validateSections = () => {
    const next: typeof sectionErrors = {}
    if (activeFulfillment === 'delivery') {
      const a = addressDraft.address
      if (!a) next.address = t('checkout.chooseAddress')
      else if (a.street.trim().length < 3) next.address = 'Add your street and house number.'
      else if (zoneLoading) next.address = t('checkout.checkingZone')
      else if (!zone?.deliverable) next.address = t('checkout.notDeliverable', { area: a.area, km: zone?.distanceKm ?? '?' })
      else if (zoneMinShort > 0) next.address = t('checkout.zoneMin', { amount: formatMoney(zone.zone!.minOrder) })
    }
    if (activeFulfillment === 'dine-in') {
      const n = Number(tableInput)
      if (!Number.isInteger(n) || n < 1 || n > settings.tableCount) next.table = `${t('checkout.chooseTable')} (1–${settings.tableCount})`
    }
    if (timing.mode === 'scheduled' && (!timing.date || !timing.time)) next.timing = t('checkout.chooseTime')
    if (timing.mode === 'asap' && !status.open) next.timing = t('checkout.closedOnlySchedule')
    setSectionErrors(next)
    const firstKey = (['address', 'table', 'timing'] as const).find((k) => next[k])
    if (firstKey) document.getElementById(firstKey === 'timing' ? 'section-timing' : 'section-fulfilment')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return !firstKey
  }

  const submit = async (values: CheckoutValues) => {
    if (!validateSections()) return
    setPlacing(true)
    try {
      const table = activeFulfillment === 'dine-in' ? Number(tableInput) : undefined
      const order = await ordersApi.placeOrder({
        items,
        fulfillment: activeFulfillment,
        tableNumber: table,
        address: activeFulfillment === 'delivery' ? addressDraft.address : undefined,
        scheduledFor: timing.mode === 'scheduled' && timing.date && timing.time ? slotToIso(timing.date, timing.time) : undefined,
        paymentMethod: values.paymentMethod,
        promoCode: promo?.code,
        customer: { id: customer?.id, name: values.name.trim(), phone: normalizeRwPhone(values.phone) },
      })

      if (customer && activeFulfillment === 'delivery' && addressDraft.isNew && addressDraft.save && addressDraft.address) {
        const { id: _id, ...address } = addressDraft.address
        authApi.saveAddress(customer.id, address).then(setCustomer, () => undefined)
      }
      if (table) setTable(table)

      let target = `/order/${order.id}/confirmed`
      if (values.paymentMethod !== 'cash') {
        const session = await paymentsApi.initiatePayment(order.id, {
          method: values.paymentMethod,
          phone: values.paymentMethod === 'card' ? undefined : normalizeRwPhone(values.momoPhone),
          cardLast4: values.paymentMethod === 'card' ? values.cardNumber.replace(/\D/g, '').slice(-4) : undefined,
        })
        target = `/checkout/pay/${order.id}?session=${encodeURIComponent(session.id)}`
      }
      placedRef.current = true
      rememberGuestOrder(order.id)
      clear()
      navigate(target, { replace: true })
    } catch (e) {
      const err = e as Error
      toast.error(err.message)
      if (e instanceof ApiError && e.code === 'sold_out') navigate('/cart')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(submit, () => {
        validateSections()
        toast.error(t('checkout.fixErrors'))
      })}
      className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_360px] lg:items-start"
    >
      <div className="flex items-center gap-2 lg:col-span-2">
        <Link to="/cart" aria-label={t('common.back')} className="-ml-2 rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">{t('checkout.title')}</h1>
      </div>

      <div className="flex flex-col gap-4">
        <Section step={1} title={t('checkout.howToGet')} id="section-fulfilment">
          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="sr-only">{t('checkout.howToGet')}</legend>
            {fulfillmentTypes.map((f) => (
              <ChoiceCard key={f} name="fulfillment" value={f} checked={activeFulfillment === f} onChange={() => setFulfillment(f)} icon={FULFILLMENT_ICONS[f]} title={t(`fulfillment.${f}`)} />
            ))}
          </fieldset>

          {activeFulfillment === 'delivery' && (
            <div className="flex flex-col gap-2">
              <h3 className="font-bold">{t('checkout.deliveryAddress')}</h3>
              <AddressPicker
                saved={customer?.addresses ?? []}
                canSave={Boolean(customer)}
                value={addressDraft}
                onChange={(d) => {
                  setAddressDraft(d)
                  setSectionErrors((s) => ({ ...s, address: undefined }))
                }}
                zone={zone}
                zoneLoading={zoneLoading}
                error={sectionErrors.address}
              />
            </div>
          )}
          {activeFulfillment === 'pickup' && (
            <p className="rounded-xl bg-muted px-3 py-2.5 text-sm">
              <span className="font-semibold">{t('checkout.pickupFrom')}:</span> {settings.address.street}, {settings.address.area}
            </p>
          )}
          {activeFulfillment === 'dine-in' && (
            <Input
              label={t('checkout.table')}
              hint={t('checkout.tableHint')}
              inputMode="numeric"
              value={tableInput}
              onChange={(e) => {
                setTableInput(e.target.value.replace(/\D/g, '').slice(0, 3))
                setSectionErrors((s) => ({ ...s, table: undefined }))
              }}
              error={sectionErrors.table}
              className="max-w-40"
            />
          )}
        </Section>

        <Section step={2} title={t('checkout.when')} id="section-timing">
          <TimingPicker
            settings={settings}
            value={timing}
            onChange={(v) => {
              setTiming(v)
              setSectionErrors((s) => ({ ...s, timing: undefined }))
            }}
            isOpen={status.open}
            asapMinutes={asapMinutes}
            error={sectionErrors.timing}
          />
        </Section>

        <Section step={3} title={t('checkout.contact')}>
          {!customer && (
            <p className="text-sm text-ink-soft">
              {t('checkout.guestNote')}{' '}
              <Link to="/login?next=/checkout" className="font-semibold text-ink underline underline-offset-2">
                {t('checkout.signIn')}
              </Link>
            </p>
          )}
          <Input label={t('checkout.name')} autoComplete="name" {...register('name')} error={errors.name?.message} />
          <Input
            label={t('checkout.phone')}
            hint={t('checkout.phoneHint')}
            inputMode="tel"
            autoComplete="tel"
            placeholder="078 123 4567"
            {...register('phone', { onBlur: (e) => !getValues('momoPhone') && setValue('momoPhone', e.target.value) })}
            error={errors.phone?.message}
          />
          <Input label={t('checkout.email')} type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        </Section>

        <Section step={4} title={t('checkout.payment')}>
          <PaymentMethodPicker form={form} methods={settings.enabledPaymentMethods} fulfillment={activeFulfillment} />
        </Section>
      </div>

      <Card className="lg:sticky lg:top-20">
        <CardBody className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold">
            {t('checkout.summary')} <span className="text-sm font-semibold text-ink-soft">· {t('checkout.items', { count: itemCount })}</span>
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((line) => (
              <li key={line.lineId} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-semibold">
                    {line.quantity}× {line.name}
                  </span>
                  {describeCustomization(line) && <span className="block truncate text-xs text-ink-soft">{describeCustomization(line)}</span>}
                </span>
                <span className="tabular-nums">{formatMoney(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line" />
          <PriceSummary pricing={pricing} settings={settings} promo={promo} deliveryPending={activeFulfillment === 'delivery' && !zone?.deliverable} showDelivery={activeFulfillment === 'delivery'} />
          {!online && (
            <p role="status" className="flex items-center gap-2 text-sm font-semibold">
              <WifiOff className="h-4 w-4" aria-hidden="true" />
              {t('offline.checkoutBlocked')}
            </p>
          )}
          <Button type="submit" size="lg" fullWidth loading={placing} disabled={!online}>
            {placing ? t('checkout.placing') : t('checkout.placeOrder', { total: formatMoney(pricing.total) })}
          </Button>
        </CardBody>
      </Card>
    </form>
  )
}
