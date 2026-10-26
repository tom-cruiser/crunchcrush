import { Banknote, CreditCard, Smartphone } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui'
import type { FulfillmentType, PaymentMethod } from '@/types'
import { formatCardNumber, formatExpiry, type CheckoutValues } from '../schema'
import { ChoiceCard } from './ChoiceCard'

const ICONS: Record<PaymentMethod, React.ReactNode> = {
  mtn_momo: <Smartphone className="h-4 w-4" />,
  airtel_money: <Smartphone className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  cash: <Banknote className="h-4 w-4" />,
}

interface PaymentMethodPickerProps {
  form: UseFormReturn<CheckoutValues>
  methods: PaymentMethod[]
  fulfillment: FulfillmentType
}

export function PaymentMethodPicker({ form, methods, fulfillment }: PaymentMethodPickerProps) {
  const { t } = useTranslation()
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form
  const method = watch('paymentMethod')

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{t('checkout.payment')}</legend>
      {methods.map((m) => (
        <div key={m}>
          <ChoiceCard name="paymentMethod" value={m} checked={method === m} onChange={() => setValue('paymentMethod', m, { shouldValidate: false })} icon={ICONS[m]} title={t(`payment.${m}`)} />
          {method === m && (m === 'mtn_momo' || m === 'airtel_money') && (
            <div className="mt-3 mb-1 px-1">
              <Input label={t('checkout.momoPhone')} hint={t('checkout.momoHint')} inputMode="tel" autoComplete="tel" placeholder={m === 'mtn_momo' ? '078 123 4567' : '073 123 4567'} {...register('momoPhone')} error={errors.momoPhone?.message} />
            </div>
          )}
          {method === m && m === 'card' && (
            <div className="mt-3 mb-1 grid grid-cols-2 gap-3 px-1">
              <div className="col-span-2">
                <Input
                  label={t('checkout.cardNumber')}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="4242 4242 4242 4242"
                  {...register('cardNumber', { onChange: (e) => setValue('cardNumber', formatCardNumber(e.target.value)) })}
                  error={errors.cardNumber?.message}
                />
              </div>
              <Input label={t('checkout.expiry')} inputMode="numeric" autoComplete="off" placeholder="12/28" {...register('cardExpiry', { onChange: (e) => setValue('cardExpiry', formatExpiry(e.target.value)) })} error={errors.cardExpiry?.message} />
              <Input label={t('checkout.cvc')} inputMode="numeric" autoComplete="off" maxLength={4} placeholder="123" {...register('cardCvc')} error={errors.cardCvc?.message} />
              <p className="col-span-2 text-xs text-ink-soft">{t('checkout.cardDemo')}</p>
            </div>
          )}
          {method === m && m === 'cash' && <p className="mt-2 mb-1 px-1 text-sm text-ink-soft">{fulfillment === 'delivery' ? t('checkout.cashDelivery') : t('checkout.cashPickup')}</p>}
        </div>
      ))}
    </fieldset>
  )
}
